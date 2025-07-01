from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI # Placeholder - User needs to configure their specific LLM
# from langchain_community.llms import HuggingFacePipeline # Example for local models
from langchain.chains import LLMChain
from langchain.docstore.document import Document as LangchainDocument
import os

# --- Configuration ---
# IMPORTANT: User needs to configure their LLM provider and model.
# For ChatOpenAI, an OPENAI_API_KEY environment variable is typically needed.
# If using a different LLM, the instantiation below will change.
# Example: llm = HuggingFacePipeline.from_model_id(model_id="google/flan-t5-large", task="text2text-generation", model_kwargs={"temperature":0.7, "max_length":500})

# Placeholder LLM initialization - REPLACE WITH ACTUAL LLM CONFIGURATION
try:
    # This is a placeholder. If the user had a specific LLM setup, it should be replicated here.
    # For example, if they were using a local model or a different cloud provider.
    llm = ChatOpenAI(temperature=0.7, model_name="gpt-3.5-turbo")
    print("LLM Service: ChatOpenAI initialized (placeholder).")
except Exception as e:
    print(f"LLM Service: Error initializing LLM - {e}. Ensure your LLM provider (e.g., OpenAI API key) is configured.")
    llm = None

# RAG Prompt Template
# This template structures how the LLM uses the retrieved documents and the question.
PROMPT_TEMPLATE = """
You are an AI assistant helping with questions about documents.
Use the following pieces of context from documents to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Keep the answer concise and relevant.

Context:
{context}

Question: {question}

Helpful Answer:
"""

def format_context(documents: list[LangchainDocument]) -> str:
    """Helper function to format the retrieved documents into a single string for the prompt."""
    return "\n\n---\n\n".join([f"Source: {doc.metadata.get('source', 'Unknown')}\nContent: {doc.page_content}" for doc in documents])

def get_rag_response(question: str, context_documents: list[LangchainDocument], user_id: str) -> tuple[str, list[dict]]:
    """
    Generates a response using an LLM based on the user's question and retrieved document context.

    Args:
        question: The user's question.
        context_documents: A list of Langchain Document objects retrieved from the vector store.
        user_id: The ID of the user (for logging or future personalization).

    Returns:
        A tuple containing:
            - answer (str): The LLM-generated answer.
            - sources (list[dict]): A list of source document metadata.
    """
    if not llm:
        return "LLM not available. Please check configuration.", []

    if not context_documents:
        # Handle cases where no relevant documents are found
        # Option 1: Try to answer without context (might hallucinate)
        # Option 2: Inform the user no relevant documents were found
        # For now, let's try a direct answer but it's better to inform about lack of context.
        # A simple response could be:
        # return "I couldn't find any specific information in your documents related to this question. Can I help with something else?", []

        # Or try to answer with a general knowledge prompt (not shown here for simplicity)
        # For this implementation, we'll indicate no context was found for a more grounded answer.
        print(f"LLM Service: No context documents provided for question by user {user_id}.")
        # Falling back to a more direct query if no context (optional, can also just return "no info")
        # For a true RAG, we'd ideally always want context.
        # If we decide to query LLM without context:
        # simple_prompt = PromptTemplate.from_template("Question: {question}\nHelpful Answer:")
        # chain = LLMChain(llm=llm, prompt=simple_prompt)
        # response = chain.invoke({"question": question})
        # return response.get("text", "Sorry, I could not process your request."), []
        return "No relevant documents found to answer the question.", []


    formatted_context = format_context(context_documents)

    prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])
    chain = LLMChain(llm=llm, prompt=prompt)

    try:
        response_data = chain.invoke({
            "context": formatted_context,
            "question": question
        })
        answer = response_data.get("text", "Sorry, I could not generate a response.")

        # Prepare sources from context_documents metadata
        sources = []
        for doc in context_documents:
            source_info = {
                "filename": doc.metadata.get("source", "Unknown"),
                # Add any other metadata you want to return, e.g., page number if available
                # "page": doc.metadata.get("page", None)
            }
            if source_info not in sources: # Avoid duplicate source entries
                 sources.append(source_info)

        print(f"LLM Service: Generated RAG response for user {user_id}.")
        return answer, sources

    except Exception as e:
        print(f"LLM Service: Error during RAG chain execution for user {user_id}: {e}")
        return "Sorry, an error occurred while generating the response.", []

# Example usage (for testing this module independently)
if __name__ == '__main__':
    if not llm:
        print("Skipping LLM service example as LLM is not initialized.")
    else:
        print("\n--- LLM Service Example ---")
        sample_question = "What are the key security policies?"
        sample_user_id = "test_llm_user"
        # Create dummy context documents
        sample_docs = [
            LangchainDocument(page_content="Policy A: All users must use strong passwords. Updated monthly.", metadata={"source": "security_manual_v1.pdf"}),
            LangchainDocument(page_content="Policy B: Data encryption is mandatory for all sensitive information.", metadata={"source": "data_protection_guide.docx"}),
            LangchainDocument(page_content="General Info: The company picnic is next Tuesday.", metadata={"source": "newsletter_q2.pdf"})
        ]

        print(f"Question: {sample_question}")
        answer, sources = get_rag_response(sample_question, sample_docs, sample_user_id)
        print(f"\nAnswer:\n{answer}")
        print(f"\nSources:\n{sources}")

        print("\n--- Example with no context ---")
        answer_no_context, sources_no_context = get_rag_response("What is the color of the sky?", [], sample_user_id)
        print(f"\nAnswer (no context):\n{answer_no_context}")
        print(f"\nSources (no context):\n{sources_no_context}")
