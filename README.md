# Multi-Agent-Document-Intelligence
MADI Intelligence is a sleek, web-based multi-agent document intelligence system for lossless PDF analysis. It features a 5-stage pipeline including visual layout auditing, OCR digitization, structure detection, entity extraction, and verified summaries, wrapped in a modern glassmorphic UI powered by Tailwind CSS and Gemini AI.

Multi-Agent Document Intelligence -> Lossless Extraction Pipeline

MADI (Multi-Agent Document Intelligence) is a high-precision document processing engine that utilizes a 5-stage agentic pipeline to transform static PDF documents into rich, structured data. By leveraging the Gemini 2.5 Flash model, the system ensures "lossless" extraction by cross-referencing visual layouts with high-precision OCR and handwriting reconstruction.


🚀 Key Features

5-Stage Agentic Pipeline: Orchestrates specialized prompts for visual auditing, digitization, layout mapping, entity extraction, and synthesis.
Lossless Digitization: Specifically designed to capture handwritten annotations, marginalia, and stamped numbers that traditional OCR often misses.
Visual Intelligence (VRDU): Audits document coordinates to identify stamps and signatures before text extraction begins.
Real-time System Console: Provides a "kernel-style" log of agent activities and pipeline status.
Responsive Glassmorphism UI: A modern, high-tech interface built with Tailwind CSS and custom animations.

🛠️ Tech Stack
Logic: JavaScript (ES6+) 
AI Engine: Google Gemini 2.5 Flash Preview 
Styling: Tailwind CSS 
Fonts: Space Grotesk & JetBrains Mono 

📋 Pipeline Protocol
The system executes the following sequence to ensure data integrity:
VRDU Analysis: Analyzes the visual layout for non-textual elements like signatures and stamps.
OCR & Digitization: Performs high-precision reconstruction of all text, including handwriting.
Layout Detection: Maps the logical structure based on headers, columns, and sections
Data Extraction: Targeted extraction of entities like Names, IDs, Dates, and Prices.
Lossless Summary: Synthesizes all gathered data into a comprehensive final report.

⚙️ Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/MADI-Intelligence.git
Add your API Key: Open script.js and insert your Gemini API Key in the apiKey variable:

JavaScript

const apiKey = "YOUR_GEMINI_API_KEY_HERE";
Launch: Simply open index.html in any modern web browser.

⚠️ Security Note
The current implementation stores the API key in a client-side variable for demonstration purposes. For production environments, it is highly recommended to move the callGemini function to a secure backend or use environment variables to prevent API key exposure.

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
