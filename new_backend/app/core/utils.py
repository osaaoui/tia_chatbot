import re
import pandas as pd # For chunk_table_rows, assuming pandas is available via camelot or other deps
import logging

# Import for table extraction - these have system dependencies
try:
    import camelot
except ImportError:
    logging.warning("Camelot-py not installed. Table extraction from PDF via Camelot will not work.")
    camelot = None

try:
    from pdf2image import convert_from_path
except ImportError:
    logging.warning("pdf2image not installed or poppler not found. OCR fallback for table extraction will not work.")
    convert_from_path = None

try:
    import pytesseract
except ImportError:
    logging.warning("pytesseract not installed or tesseract OCR engine not found. OCR fallback for table extraction will not work.")
    pytesseract = None

from .config import settings # To use TABLE_EXTRACTION_ROWS_PER_CHUNK

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)


def split_by_sections(text: str) -> list[tuple[str, str]]:
    """
    Splits text into sections based on a predefined list of keywords.
    """
    section_keywords = [
        "Title", "Subtitle", "Abstract", "Summary", "Executive Summary", "Keywords",
        "Preface", "Foreword", "Introduction", "Background", "Context", "Problem Statement",
        "Objectives", "Scope", "Related Work", "Literature Review", "Theoretical Framework",
        "Hypothesis", "Assumptions", "Methodology", "Methods", "Data Collection",
        "Data Sources", "Experimental Setup", "Materials and Methods", "Evaluation",
        "Validation", "Analysis", "Results", "Findings", "Observations", "Discussion",
        "Interpretation", "Implications", "Limitations", "Recommendations", "Future Work",
        "Use Cases", "Conclusion", "Summary and Conclusion", "Closing Remarks",
        "Acknowledgments", "Funding", "Author Contributions", "CRediT Taxonomy",
        "Conflict of Interest", "Ethical Approval", "References", "Bibliography",
        "Works Cited", "Appendices", "Appendix", "Supplementary Materials",
        "Supporting Information", "Glossary", "Abbreviations", "Index"
    ]

    # Regex to find section titles, potentially preceded by numbering like "1.", "1)", "I."
    # It looks for keywords that are likely on their own line or with minimal surrounding text.
    section_pattern = re.compile(
        r"^\s*(\d{1,2}[\.\)]?\s*|\[\d{1,2}\]|Chapter \d{1,2}\s*[:\.\-]?\s*|Section \d{1,2}\s*[:\.\-]?\s*)?"
        r"(" + "|".join(map(re.escape, section_keywords)) + r")"
        r"\s*[:\.\-]?\s*$",
        re.IGNORECASE | re.MULTILINE
    )

    # Find all matches for section headers to use as split points
    matches = list(section_pattern.finditer(text))

    structured_sections = []
    last_pos = 0

    if not matches: # If no sections found, treat the whole text as one section (e.g. "Content")
        if text.strip():
            return [("Content", text.strip())]
        return []

    # Add content before the first section, if any
    first_match_start = matches[0].start()
    if first_match_start > 0:
        initial_content = text[:first_match_start].strip()
        if initial_content:
            structured_sections.append(("Preamble", initial_content)) # Or some generic title

    for i, match in enumerate(matches):
        section_title = match.group(2).strip() # The keyword itself

        start_pos = match.end()
        end_pos = matches[i+1].start() if i + 1 < len(matches) else len(text)

        section_text = text[start_pos:end_pos].strip()

        if section_text: # Only add if there's content
            structured_sections.append((section_title.title(), section_text))

        last_pos = end_pos

    return structured_sections


def chunk_table_rows(df: pd.DataFrame, rows_per_chunk: int = settings.TABLE_EXTRACTION_ROWS_PER_CHUNK) -> list[str]:
    """
    Split a DataFrame into chunks of N rows and convert each to Markdown.
    """
    chunks = []
    if df.empty:
        return chunks
    num_chunks = (len(df) + rows_per_chunk - 1) // rows_per_chunk
    for i in range(num_chunks):
        chunk_df = df.iloc[i*rows_per_chunk:(i+1)*rows_per_chunk]
        try:
            md_chunk = chunk_df.to_markdown(index=False)
            chunks.append(md_chunk)
        except Exception as e:
            logger.error(f"Error converting DataFrame chunk to Markdown: {e}")
            # Fallback: convert to string or skip
            chunks.append(str(chunk_df))
    return chunks


def extract_tables_from_pdf(file_path: str, original_filename: str) -> list[dict]:
    """
    Extract tables from PDF using Camelot, with fallback to OCR if Camelot fails or finds no tables.
    Chunks long tables into smaller pieces.
    Returns a list of dictionaries, each containing table content and metadata.
    """
    table_data_for_docs = []

    # Attempt 1: Camelot
    if camelot:
        try:
            logger.info(f"Attempting table extraction with Camelot for {original_filename}...")
            tables = camelot.read_pdf(file_path, pages='all', strip_text='\n', line_scale=40)
            logger.info(f"Camelot found {len(tables)} table(s) in {original_filename}.")

            if len(tables) > 0:
                for i, table in enumerate(tables):
                    df = table.df
                    if df.empty:
                        logger.info(f"Table {i} in {original_filename} from Camelot is empty, skipping.")
                        continue

                    chunks = chunk_table_rows(df) # Uses chunk size from settings
                    for j, chunk_content in enumerate(chunks):
                        table_data_for_docs.append({
                            "content": chunk_content,
                            "metadata": {
                                "source_type": "table_camelot",
                                "original_source": original_filename, # Keep original filename
                                "table_page": table.page,
                                "table_order_on_page": i,
                                "table_chunk_id": j
                            }
                        })
                # If Camelot found tables, we might not need OCR unless specifically desired
                # For now, if Camelot works, we return its results.
                if table_data_for_docs:
                    logger.info(f"Successfully extracted and chunked {len(table_data_for_docs)} table segments using Camelot for {original_filename}.")
                    return table_data_for_docs
            else: # Camelot ran but found no tables
                 logger.info(f"Camelot ran but found no tables in {original_filename}. Considering OCR fallback.")

        except Exception as e:
            logger.warning(f"Camelot table extraction failed for {original_filename}: {e}. Attempting OCR fallback if configured.")
    else:
        logger.info("Camelot not available. Skipping Camelot-based table extraction.")

    # Attempt 2: OCR Fallback (if pdf2image and pytesseract are available)
    if convert_from_path and pytesseract:
        logger.info(f"Attempting OCR-based table extraction for {original_filename} as Camelot found nothing or failed.")
        try:
            images = convert_from_path(file_path)
            for i, image in enumerate(images):
                # TODO: Improve OCR table detection. This is very basic.
                # Consider using image processing to identify table regions before OCR.
                # For now, it OCRs the whole page and hopes for structured text.
                text = pytesseract.image_to_string(image)
                # Basic check for table-like structures (pipe, plus, multiple hyphens)
                if re.search(r"(\|.*\|)|(\+.*\+)|(-{3,})", text):
                    # This is a very naive way to treat OCR'd text as a table.
                    # Ideally, this text would be further processed to be structured or chunked.
                    # For now, adding the whole OCR'd page if it looks like it might contain a table.
                    table_data_for_docs.append({
                        "content": text.strip(),
                        "metadata": {
                            "source_type": "table_ocr",
                            "original_source": original_filename,
                            "table_page": i + 1,
                        }
                    })
            if table_data_for_docs:
                 logger.info(f"Extracted {len(table_data_for_docs)} potential table segments using OCR for {original_filename}.")

        except Exception as ocr_e:
            logger.error(f"OCR-based table extraction failed for {original_filename}: {ocr_e}")
    else:
        logger.info("OCR tools (pdf2image/pytesseract) not available. Skipping OCR-based table extraction.")

    return table_data_for_docs


if __name__ == '__main__':
    # Basic test for split_by_sections
    sample_text_with_sections = """
    Introduction
    This is the intro.
    1. Methods
    These are the methods.
    Results
    Here are results.
    Conclusion
    The end.
    """
    sample_text_no_sections = "Just a single block of text without clear section headers."

    print("--- Testing split_by_sections ---")
    sections1 = split_by_sections(sample_text_with_sections)
    print(f"Found {len(sections1)} sections in sample_text_with_sections:")
    for title, content in sections1:
        print(f"  Title: {title}, Content Preview: {content[:30]}...")

    sections2 = split_by_sections(sample_text_no_sections)
    print(f"\nFound {len(sections2)} sections in sample_text_no_sections:")
    for title, content in sections2:
        print(f"  Title: {title}, Content Preview: {content[:30]}...")

    # Note: Testing extract_tables_from_pdf requires a PDF file and relevant system dependencies.
    # Example:
    # Create a dummy PDF or use a known one for testing.
    # tables = extract_tables_from_pdf("path/to/your/sample.pdf", "sample.pdf")
    # print(f"\n--- Extracted Tables (example) ---")
    # for t_data in tables:
    #     print(f"Source Type: {t_data['metadata']['source_type']}, Page: {t_data['metadata'].get('table_page')}")
    #     print(f"Content Preview: {t_data['content'][:100]}...")
    #     print("-" * 10)

    pass
