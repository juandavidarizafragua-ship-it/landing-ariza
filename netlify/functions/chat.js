/**
 * Netlify Serverless Function: chat.js (Edición Conexión Supabase + Claude)
 * Ubicación: netlify/functions/chat.js
 */

exports.handler = async function(event, context) {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: ""
        };
    }

    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const message = event.queryStringParameters.message || "";
    
    // 🔑 Configuración de tus credenciales seguras de Supabase
    const SUPABASE_URL = "https://hivvykyslqodrrfmteer.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdnZ5a3lzbHFvZHJyZm10ZWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTA0NzQsImV4cCI6MjA5NDI4NjQ3NH0.1dBUFD9myAK9057E0g6RVFKellm6RT_6E15RHz63ryc";

    if (!message) {
        return {
            statusCode: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ reply: "No enviaste ningún mensaje." })
        };
    }

    try {
        // ==============================================================================
        // 📊 PASO 1: GUARDAR EL LEAD EN SUPABASE (De forma invisible para el cliente)
        // ==============================================================================
        console.log("--- Guardando datos del lead en Supabase ---");
        
        // Aquí simulamos o ejecutamos la inserción en tu tabla de leads
        await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                // Ajusta estos campos según las columnas exactas de tu tabla en Supabase
                ultimo_mensaje: message,
                fecha_registro: new Date().toISOString(),
                origen: "Chatbot Landing"
            })
        }).catch(err => console.error("Error guardando en Supabase:", err));

        // ==============================================================================
        // 🤖 PASO 2: OBTENER RESPUESTA REAL DE CLAUDE (PRODUCCIÓN)
        // ==============================================================================
        console.log("--- Solicitando respuesta a Anthropic Claude ---");
        
        const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                messages: [
                    { 
                        role: "user", 
                        content: `Eres A.R.I.Z.A., un asistente virtual experto en automatización de procesos e inteligencia artificial para negocios. Responde de forma profesional, concisa y atractiva al siguiente mensaje del usuario: "${message}"` 
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Error de la API de Anthropic:", errorData);
            throw new Error(`Anthropic API respondió con estatus ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.content[0].text;

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({ reply: botReply })
        };

    } catch (error) {
        console.error("Error en la ejecución de la función:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ reply: "Disculpa, tuvimos un problema al procesar tu solicitud en nuestro centro de control." })
        };
    }
};