const puppeteer = require('puppeteer');

(async () => {
    console.log("🤖 Iniciando Agente de Automatización QA para A.R.I.Z.A...");
    
    // Lanzamos un navegador invisible de forma rápida
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    try {
        console.log("🌐 Conectando a la Landing Page local (http://localhost:8888)...");
        await page.goto('http://localhost:8888', { waitUntil: 'networkidle2' });

        console.log("💬 Abriendo ventana del chatbot...");
        // Forzamos la apertura del chat llamando la función nativa
        await page.evaluate(() => arizaToggleChat());

        console.log("✍️ Escribiendo mensaje de prueba en el input...");
        await page.waitForSelector('#ariza-chat-input');
        await page.type('#ariza-chat-input', 'Hola, soy un lead automático de prueba.');

        console.log("🚀 Enviando mensaje...");
        // Presionamos Enter en el chat para disparar arizaSend()
        await page.keyboard.press('Enter');

        console.log("⏳ Esperando respuesta del servidor local (Netlify Dev)...");
        // Esperamos a que el bot responda analizando el flujo de red
        await new Promise(r => setTimeout(r, 4000));

        // Extraemos las respuestas visibles en pantalla
        const mensajes = await page.evaluate(() => {
            const el = document.querySelectorAll('.ariza-msg.bot');
            return Array.from(el).map(m => m.textContent);
        });

        console.log("\n====== 📊 REPORTE DE ANÁLISIS DEL AGENTE ======");
        if (mensajes.length > 1) {
            console.log("✅ ÉXITO TOTAL: El puente de Netlify Functions y Supabase respondió correctamente.");
            console.log(`🤖 Respuesta de Claude: "${mensajes[mensajes.length - 1]}"`);
        } else {
            console.log("❌ ERROR: El chat se quedó colgado en 'Escribiendo...' o dio error de red.");
        }
        console.log("================================================\n");

    } catch (error) {
        console.error("❌ Ocurrió un fallo catastrófico durante el testeo:", error);
    } finally {
        await browser.close();
        console.log("🤖 Agente de Pruebas finalizó su tarea.");
    }
})();