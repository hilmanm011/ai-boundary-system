import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { knowledgeSources } from "./schema.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding knowledge_sources...");

  await db.insert(knowledgeSources).values([
    {
      title: "What is Artificial Intelligence?",
      content:
        "Artificial Intelligence (AI) is a branch of computer science focused on building systems capable of performing tasks that typically require human intelligence. These tasks include learning from data, recognizing patterns, making decisions, understanding natural language, and perceiving visual information. AI can be categorized into narrow AI (designed for specific tasks like image recognition or language translation) and general AI (a theoretical concept of machines with human-level reasoning across all domains).",
      sourceType: "docs",
    },
    {
      title: "Machine Learning Fundamentals",
      content:
        "Machine Learning (ML) is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. There are three main types: supervised learning (trained on labeled data to predict outcomes), unsupervised learning (finds hidden patterns in unlabeled data), and reinforcement learning (learns through trial and error with rewards). Common algorithms include linear regression, decision trees, random forests, support vector machines, and neural networks.",
      sourceType: "docs",
    },
    {
      title: "Deep Learning and Neural Networks",
      content:
        "Deep Learning is a subset of machine learning that uses artificial neural networks with multiple layers (hence 'deep') to model complex patterns in data. Key architectures include Convolutional Neural Networks (CNNs) for image processing, Recurrent Neural Networks (RNNs) for sequential data, and Transformers for natural language processing. The Transformer architecture, introduced in 2017, revolutionized NLP and is the foundation of modern large language models like GPT, LLaMA, and Gemini.",
      sourceType: "docs",
    },
    {
      title: "Large Language Models (LLMs)",
      content:
        "Large Language Models are AI systems trained on massive text datasets to understand and generate human-like text. They use the Transformer architecture with billions of parameters. LLMs can perform tasks like text generation, summarization, translation, code writing, and question answering. Notable examples include OpenAI's GPT series, Meta's LLaMA, Google's Gemini, Anthropic's Claude, and Mistral AI's models. They work by predicting the next token in a sequence based on the context provided.",
      sourceType: "docs",
    },
    {
      title: "Prompt Engineering",
      content:
        "Prompt engineering is the practice of designing and optimizing input prompts to get the best possible output from AI models. Key techniques include: zero-shot prompting (asking directly without examples), few-shot prompting (providing examples in the prompt), chain-of-thought prompting (asking the model to reason step by step), and system prompts (setting the model's behavior and constraints). Good prompts are specific, provide context, define the expected output format, and set clear boundaries.",
      sourceType: "docs",
    },
    {
      title: "AI Ethics and Responsible AI",
      content:
        "Responsible AI development involves addressing bias in training data, ensuring transparency in decision-making, protecting user privacy, and maintaining human oversight. Key concerns include algorithmic bias (where AI systems reflect or amplify societal biases), hallucination (where models generate plausible but incorrect information), deepfakes, job displacement, and the environmental cost of training large models. Organizations should implement AI governance frameworks, conduct regular audits, and ensure human-in-the-loop processes for critical decisions.",
      sourceType: "policy",
    },
    {
      title: "Natural Language Processing (NLP)",
      content:
        "Natural Language Processing is a field of AI that focuses on the interaction between computers and human language. Core NLP tasks include tokenization (breaking text into words or subwords), named entity recognition (identifying people, places, organizations), sentiment analysis (determining emotional tone), text classification, machine translation, and text summarization. Modern NLP relies heavily on pre-trained language models that can be fine-tuned for specific tasks.",
      sourceType: "docs",
    },
    {
      title: "Computer Vision",
      content:
        "Computer Vision is an AI field that enables machines to interpret and understand visual information from the world. Applications include image classification, object detection, facial recognition, medical image analysis, autonomous vehicles, and augmented reality. Key techniques involve convolutional neural networks (CNNs), vision transformers (ViTs), and multimodal models that combine vision with language understanding.",
      sourceType: "docs",
    },
    {
      title: "FAQ - What is RAG?",
      content:
        "Retrieval-Augmented Generation (RAG) is a technique that enhances LLM responses by retrieving relevant information from external knowledge bases before generating an answer. Instead of relying solely on the model's training data, RAG first searches a document store or database for relevant context, then feeds that context to the LLM along with the user's query. This reduces hallucination, keeps responses grounded in factual data, and allows the system to access up-to-date information without retraining the model.",
      sourceType: "faq",
    },
    {
      title: "FAQ - What is Fine-Tuning?",
      content:
        "Fine-tuning is the process of taking a pre-trained AI model and further training it on a smaller, domain-specific dataset to specialize its behavior. This allows organizations to adapt general-purpose models for specific use cases like medical diagnosis, legal document analysis, or customer support. Fine-tuning is more cost-effective than training a model from scratch and typically requires less data. Common approaches include full fine-tuning, LoRA (Low-Rank Adaptation), and QLoRA (Quantized LoRA).",
      sourceType: "faq",
    },
    {
      title: "FAQ - What are AI Agents?",
      content:
        "AI Agents are autonomous systems that use LLMs as their reasoning engine to plan, execute, and iterate on tasks. Unlike simple chatbots that respond to single prompts, agents can break down complex goals into steps, use external tools (APIs, databases, web search), maintain memory across interactions, and self-correct when they encounter errors. Popular agent frameworks include LangChain, CrewAI, AutoGen, and OpenAI's Assistants API.",
      sourceType: "faq",
    },
    {
      title: "AI in Healthcare",
      content:
        "AI is transforming healthcare through applications like medical image analysis (detecting tumors in X-rays and MRIs), drug discovery (predicting molecular interactions), personalized treatment plans, clinical trial optimization, and administrative automation. AI-powered diagnostic tools can detect diseases like diabetic retinopathy and skin cancer with accuracy comparable to specialists. However, regulatory approval, data privacy (HIPAA compliance), and clinical validation remain critical challenges.",
      sourceType: "docs",
    },
    {
      title: "AI in Software Development",
      content:
        "AI is increasingly used in software development for code generation, code review, bug detection, test generation, and documentation. Tools like GitHub Copilot, Cursor, and Kiro use LLMs to assist developers in writing code faster and with fewer errors. AI can also help with code refactoring, security vulnerability detection, and translating code between programming languages. The key is using AI as a collaborative tool while maintaining human oversight for code quality and security.",
      sourceType: "docs",
    },
    {
      title: "Content Review Policy",
      content:
        "All AI-generated content in this system must go through a mandatory human review process before publication. Reviewers should verify factual accuracy against the knowledge sources, check for hallucinated information, ensure the tone and style are appropriate, and confirm that no sensitive or harmful content is present. Drafts can be edited by reviewers before approval. Once approved, content is moved to the published_content table and cannot be modified without creating a new draft.",
      sourceType: "policy",
    },
    {
      title: "API Usage Guide",
      content:
        "This API provides endpoints for AI content generation, viewing draft lists, editing drafts, and approving or rejecting drafts. The workflow is: 1) Send a prompt to POST /ai/generate to create a draft, 2) Review the draft via GET /ai/drafts/:id, 3) Optionally edit the draft via PUT /ai/drafts/:id, 4) Approve via POST /ai/drafts/:id/approve or reject via POST /ai/drafts/:id/reject. All requests that modify data require a userId for audit tracking. Only drafts with status 'draft' can be edited, approved, or rejected.",
      sourceType: "docs",
    },
  ]);

  console.log("✅ Seed complete! 15 knowledge sources added.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
