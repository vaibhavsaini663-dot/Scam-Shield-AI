🛡️ ScamShield AI

AI-Powered Scam Detection & Digital Safety Assistant

ScamShield AI is a digital-safety project designed to help users recognize potentially suspicious messages and URLs. It aims to highlight common warning signs in fake job or internship offers, phishing messages, payment requests, and other online scams.

Hackathon: HackIndia AI, Web3 & FutureTech Hackathon 2026 — Lucknow

My Role: Frontend Developer

✨ Features

Message scanning: Submit a suspicious message for analysis.

URL scanning: Check a URL for potentially suspicious patterns.

Risk assessment: Display a risk score and level when returned by the analysis service.

Suspicious indicators: Show warning signs found in the submitted content.

Safety recommendations: Offer practical suggestions for staying safe online.

Scan history: Keep a record of recent scans where supported by the application.

Responsive interface: Designed for desktop and mobile screens.

ScamShield AI is an awareness aid. Its results are not a guarantee that content is safe or malicious.

👨‍💻 My Contribution — Frontend Developer

I contributed to the frontend development of ScamShield AI for the HackIndia hackathon. My work focused on the user interface and scanning experience, including:

Building the dashboard and scanner interface.

Styling the application with HTML and CSS.

Adding interactive behavior with JavaScript.

Presenting scan results, risk information, and safety recommendations.

Connecting the frontend to the backend API.

Improving responsive layouts and the overall user experience.

🧰 Tech Stack

Frontend

HTML5

CSS3

JavaScript

Fetch API

Browser Local Storage (where used)

Backend / AI

Python

FastAPI

OpenAI API

Backend and AI features require the corresponding dependencies and configuration to be present in the project.

📁 Project Structure

The exact files may vary by version. The project typically includes frontend files and a Python API backend:

ScamShield-AI/
├── index.html
├── style.css
├── script.js
├── main.py
├── requirements.txt
├── .gitignore
└── README.md

⚙️ Setup and Run

1. Clone the repository

Replace the placeholders with your GitHub username and repository name:

git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY

2. Create a Python virtual environment

python -m venv .venv

Windows:

.venv\Scripts\activate

macOS/Linux:

source .venv/bin/activate

3. Install backend dependencies

pip install -r requirements.txt

4. Configure environment variables

If the backend uses the OpenAI API, create a local .env file in the location expected by the backend and add your own key:

OPENAI_API_KEY=your_api_key_here

Use the model name and other variables expected by your code. Never commit your real API key or .env file to GitHub.

5. Start the backend

If main.py defines a FastAPI application named app, run:

uvicorn main:app --reload --port 8000

The local API will usually be available at http://127.0.0.1:8000. Check your backend code for the actual endpoint paths and configuration.

6. Open the frontend

Open index.html in your browser. If the frontend makes API requests, make sure the backend is running and the API base URL in script.js matches your local backend address.

🔄 How It Works

The user enters a suspicious message or URL.

The frontend sends the content to the backend, when API integration is configured.

The backend analyzes the content using the implemented detection logic and, if configured, an AI service.

The frontend displays the returned risk assessment, warning signs, explanation, and safety suggestions.

🧪 Example

Sample message:

You have been selected for an internship. Pay a registration fee within 24 hours to confirm your position.

Possible warning signs include a request for money, time pressure, and an unverified recruitment offer. This example is illustrative; actual results depend on the application's analysis.

🔐 Security and Privacy

Keep API keys and credentials out of source control.

Add .env and other secret files to .gitignore.

Do not submit real passwords, OTPs, banking details, or other sensitive information for testing.

Verify suspicious offers and links through official channels.

Do not rely on an automated risk score as the only basis for a decision.

🏆 Hackathon

ScamShield AI was developed for HackIndia AI, Web3 & FutureTech Hackathon 2026 — Lucknow to explore how AI-assisted analysis and a clear user interface can help people become more aware of online scams.

Team

Abhishek Saini — Team Leader

Vaibhav Saini — Frontend Developer

🚀 Future Improvements

Browser extension for checking URLs

More detailed URL and domain analysis

Multilingual scam detection

Additional scam categories

Improved accessibility and mobile experience

Optional cloud-based scan history

More digital-safety learning resources

⚠️ Disclaimer

ScamShield AI is an educational project intended to support online-safety awareness. Automated analysis can make mistakes, miss scams, or flag legitimate content. Always verify important messages, job offers, and websites through trusted official sources.
