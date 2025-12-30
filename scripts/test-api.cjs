const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function main() {
    try {
        // 1. Load API Key
        const envPath = path.resolve(__dirname, '..', '.env.local');
        let apiKey = '';

        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const match = content.match(/API_KEY=(.*)/);
            if (match) {
                apiKey = match[1].trim();
                // Remove quotes if present
                apiKey = apiKey.replace(/^["']|["']$/g, '');
            }
        }

        if (!apiKey) {
            console.error("❌ Could not find API_KEY in .env.local");
            process.exit(1);
        }

        console.log(`🔑 Key found: ${apiKey.substring(0, 5)}...`);

        // 2. Initialize SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. Try to get model info logic (Simulated by trying to generate content on a strict model)
        console.log("📡 Testing connection to 'gemini-1.5-flash'...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        try {
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log("✅ SUCCESS! Response: ", response.text());
        } catch (e) {
            console.error("❌ Failed to use gemini-1.5-flash.");
            console.error("Error details:", e.message);

            // Fallback test
            console.log("\n📡 Testing fallback 'gemini-pro'...");
            try {
                const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
                const resultPro = await modelPro.generateContent("Hello?");
                console.log("✅ SUCCESS with gemini-pro! Response: ", resultPro.response.text());
                console.log("💡 RECOMMENDATION: Change the model in services/geminiService.ts to 'gemini-pro'");
            } catch (e2) {
                console.error("❌ Failed to use gemini-pro as well.");
                console.error("Error details:", e2.message);
            }
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

main();
