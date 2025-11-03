import { LLM } from '../microagents/llm/llm';
import { MicroAgent, BaseMessageStore } from '../microagents/core';

// Konfigurasi LLM sesuai permintaan
const chatLLM = new LLM(
    "https://llm.ponpeskanzululumcirebon.com/v1",
    "sk-f6825e70c7904bbeb944850e6084500e",
    "gemini-2.5-flash",
    4000,
    0.8,
    0.9
);

// MicroAgent untuk evaluasi penulisan kreatif dengan Chain of Thought
const creativeWritingAgent = new MicroAgent(
    chatLLM,
    `Anda adalah asisten penulisan kreatif yang memberikan proses berpikir secara rinci sebelum memberikan jawaban akhir.
    
    Tugas Anda:
    1. Analisis permintaan penulisan kreatif dari pengguna
    2. Berikan proses berpikir langkah demi langkah dalam bidang "reasoning"
    3. Hasilkan respons kreatif dalam bidang "response"
    4. Kembalikan dalam format JSON dengan struktur: {"reasoning": "...", "response": "..."}
    
    Aturan:
    - Respons dalam bidang "response" harus sekitar jumlah kata yang ditentukan
    - Berikan HANYA objek JSON, tanpa penjelasan atau teks tambahan`,
    []
);

// Fungsi untuk evaluasi penulisan kreatif dengan CoT
async function evaluateCreativeWritingWithCoT(task: string, targetWords: number): Promise<{ reasoning: string, response: string }> {
    // Prompt dengan CoT sesuai dengan spesifikasi yang diberikan
    const prompt = `Hasilkan respons terhadap prompt masukan. Respons harus sekitar ${targetWords} kata.\n\nPertama, berikan satu bidang "reasoning" sebagai string, merinci proses berpikir langkah demi langkah Anda.\n\nKemudian, berikan respons Anda di bidang "response".\n\nBerikan HANYA objek JSON, tanpa penjelasan atau teks tambahan.\n\nPrompt: ${task}`;

    try {
        const messageStore = new BaseMessageStore();
        const response = await creativeWritingAgent.executeAgent(prompt, messageStore);

        // Parsing JSON dari respons
        // Membersihkan respons dari karakter tambahan sebelum parsing
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}') + 1;
        const jsonString = response.substring(jsonStart, jsonEnd);

        const parsedResponse = JSON.parse(jsonString);
        return {
            reasoning: parsedResponse.reasoning,
            response: parsedResponse.response
        };
    } catch (error) {
        console.error('Error dalam evaluasi penulisan kreatif dengan CoT:', error);
        return {
            reasoning: 'Error dalam proses: ' + (error as Error).message,
            response: 'Error: Gagal menghasilkan respons'
        };
    }
}

// Contoh penggunaan untuk berbagai jenis tugas penulisan kreatif dengan CoT
async function runCreativeWritingCoTDemo() {
    console.log('=== Demo Penulisan Kreatif dengan Chain of Thought ===\n');

    // Contoh tugas puisi
    console.log('1. Membuat Puisi (dengan CoT):');
    const poemTask = "Tulis sebuah puisi tentang keindahan alam di pagi hari";
    const poemResult = await evaluateCreativeWritingWithCoT(poemTask, 100);
    console.log('Reasoning:', poemResult.reasoning);
    console.log('Response:', poemResult.response);
    console.log('\n' + '='.repeat(50) + '\n');

    // Contoh tugas lelucon
    console.log('2. Membuat Lelucon (dengan CoT):');
    const jokeTask = "Ciptakan lelucon segar tentang programmer dan bug";
    const jokeResult = await evaluateCreativeWritingWithCoT(jokeTask, 50);
    console.log('Reasoning:', jokeResult.reasoning);
    console.log('Response:', jokeResult.response);
    console.log('\n' + '='.repeat(50) + '\n');

    // Contoh tugas cerita
    console.log('3. Membuat Cerita Pendek (dengan CoT):');
    const storyTask = "Tulis cerita pendek tentang seorang anak yang menemukan portal menuju dunia ajaib";
    const storyResult = await evaluateCreativeWritingWithCoT(storyTask, 200);
    console.log('Reasoning:', storyResult.reasoning);
    console.log('Response:', storyResult.response);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('Demo dengan Chain of Thought selesai!');
}

// Menjalankan demo
runCreativeWritingCoTDemo().catch(console.error);

export { evaluateCreativeWritingWithCoT, runCreativeWritingCoTDemo };