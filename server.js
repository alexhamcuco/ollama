import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// --- Simulación de MongoDB ---
const users = [
  {
    id: 1,
    name: "John",
    level: "beginner",
    commonErrors: [
      "Uses 'is' instead of 'está'",
      "Confuses 'por' and 'para'",
      "Forgets gender agreement (el/la)",
    ],
  },
];

// --- Endpoint principal del chat ---
// app.post("/api/chat", async (req, res) => {
//   const { userId, message } = req.body;
//   const user = users.find((u) => u.id === userId);

//   if (!user) {
//     return res.status(404).json({ error: "User not found" });
//   }

//   const prompt = `
// You are a Spanish teacher helping an English-speaking student named ${user.name}.
// Their Spanish level is ${user.level}.
// They often make the following mistakes: ${user.commonErrors.join(", ")}.
// The user just said: "${message}".
// Respond naturally in Spanish, correcting errors gently and explaining if needed.
// `;

//   try {
//     const response = await fetch("http://localhost:11434/api/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "mistral",
//         prompt,
//       }),
//     });

//     const text = await response.text(); // <-- capturamos la respuesta como texto
//     console.log("Respuesta de Ollama:", text);

//     let data;
//     try {
//       data = JSON.parse(text); // <-- parseamos solo si es JSON válido
//     } catch (err) {
//       console.error("JSON inválido recibido:", err);
//       return res.status(500).json({
//         error: "Invalid JSON from Ollama",
//         raw: text,
//       });
//     }

//     // Validamos que la respuesta tenga el campo 'response'
//     if (!data.response) {
//       return res.status(500).json({
//         error: "Ollama response missing 'response' field",
//         raw: data,
//       });
//     }

//     return res.json({ reply: data.response });
//   } catch (error) {
//     console.error("Error comunicando con Ollama:", error);
//     return res.status(500).json({ error: "Error communicating with Ollama" });
//   }
// });

app.post("/api/chat", async (req, res) => {
  const { userId, message } = req.body;
  const user = users.find((u) => u.id === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  const prompt = `
You are a Spanish teacher helping an English-speaking student named ${
    user.name
  }.
Their Spanish level is ${user.level}.
They often make the following mistakes: ${user.commonErrors.join(", ")}.
The user just said: "${message}".
Respond naturally in Spanish, correcting errors gently and explaining if needed.
`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "mistral", prompt }),
    });

    const text = await response.text(); // capturamos todo como texto
    // Cada línea es un JSON parcial
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    let fullReply = "";

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj.response) fullReply += obj.response;
      } catch (err) {
        // ignoramos líneas que no sean JSON
      }
    }

    return res.json({ reply: fullReply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error communicating with Ollama" });
  }
});

app.listen(3001, () => console.log("✅ Server running on port 3001"));
