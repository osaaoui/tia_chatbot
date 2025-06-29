from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from services.vectorstore import get_vectorstore

custom_prompt = PromptTemplate.from_template("""
You are Softia, an assistant that answers questions based on uploaded documents.
Answer clearly and cite sources if relevant.

Context:
{context}

Question:
{question}
""")

def get_rag_response(question: str, user_id: str):
    vectorstore = get_vectorstore(user_id)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    qa_chain = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(model="gpt-4o-mini-2024-07-18"),
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": custom_prompt},
        return_source_documents=True
    )

    result = qa_chain.invoke({"query": question})
    sources = [doc.metadata.get("source", "") for doc in result.get("source_documents", [])]
    return result.get("result"), sources