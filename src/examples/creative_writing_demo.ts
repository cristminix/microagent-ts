import { LLM } from '../microagents/llm/llm';

// Konfigurasi LLM sesuai permintaan
const chatLLM = new LLM(
    "https://llm.ponpeskanzululumcirebon.com/v1",
    "sk-f6825e70c7904bbeb944850e6084500e",
    "gemini-2.5-flash",
    4000,
    0.8,
    0.9
);

// Fungsi untuk evaluasi penulisan kreatif
async function evaluateCreativeWriting(task: string, targetWords: number): Promise<string> {
    // Prompt langsung sesuai dengan spesifikasi yang diberikan
    const prompt = `Hasilkan respons terhadap prompt masukan. Respons harus sekitar ${targetWords} kata.\n\nKeluarkan HANYA responsnya, tanpa penjelasan atau teks tambahan.\n\nPrompt: ${task}`;

    try {
        // Gunakan metode chat karena server mungkin hanya mendukung endpoint chat
        const messages = [{ role: 'user', content: prompt }];
        const response = await chatLLM.chat(messages);
        return response;
    } catch (error) {
        console.error('Error dalam evaluasi penulisan kreatif:', error);
        return 'Error: Gagal menghasilkan respons';
    }
}

// Contoh penggunaan untuk berbagai jenis tugas penulisan kreatif
async function runCreativeWritingDemo() {
    console.log('=== Demo Penulisan Kreatif ===\n');

    // Contoh tugas puisi
    console.log('1. Membuat Puisi:');
    const poemTask = "Tulis sebuah puisi tentang keindahan alam di pagi hari";
    const poemResult = await evaluateCreativeWriting(poemTask, 100);
    console.log(poemResult);
    console.log('\n' + '='.repeat(50) + '\n');

    // Contoh tugas lelucon
    console.log('2. Membuat Lelucon:');
    const jokeTask = "Ciptakan lelucon segar tentang programmer dan bug";
    const jokeResult = await evaluateCreativeWriting(jokeTask, 50);
    console.log(jokeResult);
    console.log('\n' + '='.repeat(50) + '\n');

    // Contoh tugas cerita
    console.log('3. Membuat Cerita Pendek:');
    const storyTask = "Tulis cerita pendek tentang seorang anak yang menemukan portal menuju dunia ajaib";
    const storyResult = await evaluateCreativeWriting(storyTask, 200);
    console.log(storyResult);
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('Demo selesai!');
}

// Menjalankan demo
runCreativeWritingDemo().catch(console.error);

export { evaluateCreativeWriting, runCreativeWritingDemo };