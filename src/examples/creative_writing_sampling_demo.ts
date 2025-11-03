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

// Fungsi untuk evaluasi penulisan kreatif dengan sampling (urutan)
async function evaluateCreativeWritingSampling(task: string, targetWords: number, numSamplings: number): Promise<string[]> {
    // Prompt urutan sesuai dengan spesifikasi yang diberikan
    const prompt = `Hasilkan ${numSamplings} respons terhadap prompt masukan. Setiap respons harus sekitar ${targetWords} kata.\n\nKembalikan tepat ${numSamplings} respons sebagai daftar string Python, diformat sebagai:\n\n["response1", "response2", "response3", ...]\n\nKeluarkan HANYA daftar, tanpa penjelasan atau teks tambahan.\n\nPrompt: ${task}`;

    try {
        const response = await chatLLM.chat([{ role: 'user', content: prompt }]);

        // Parsing respons sebagai array Python
        // Mencari bagian array dalam respons
        const arrayStart = response.indexOf('[');
        const arrayEnd = response.lastIndexOf(']') + 1;

        if (arrayStart !== -1 && arrayEnd !== -1) {
            const arrayString = response.substring(arrayStart, arrayEnd);

            // Parsing array dari string
            try {
                // Mengganti petik satu ke petik dua untuk parsing JSON
                let jsonString = arrayString.replace(/'/g, '"');

                // Menangani kasus di mana kutipan mungkin bersarang dalam respons
                const parsedArray = JSON.parse(jsonString);
                return parsedArray;
            } catch (parseError) {
                console.error('Error parsing response as array:', parseError);

                // Jika parsing gagal, coba ekstraksi manual
                const regex = /"(?:[^"\\]|\\.)*"/g;
                const matches = arrayString.match(regex);
                if (matches) {
                    return matches.map(str => str.slice(1, -1)); // Hapus kutipan di awal dan akhir
                }

                return [`Error parsing response: ${response}`];
            }
        } else {
            return [`Error: Could not find array in response: ${response}`];
        }
    } catch (error) {
        console.error('Error dalam evaluasi penulisan kreatif dengan sampling:', error);
        return [`Error: Gagal menghasilkan respons - ${(error as Error).message}`];
    }
}

// Fungsi untuk evaluasi penulisan kreatif multi-giliran
async function evaluateCreativeWritingMultiTurn(task: string, targetWords: number, numTurns: number): Promise<string[]> {
    const responses: string[] = [];

    // Prompt giliran pertama
    const firstTurnPrompt = `Hasilkan respons terhadap prompt masukan. Respons harus sekitar ${targetWords} kata.\n\nKeluarkan HANYA responsnya, tanpa penjelasan atau teks tambahan.\n\nPrompt: ${task}`;

    try {
        // Giliran pertama
        let response = await chatLLM.chat([{ role: 'user', content: firstTurnPrompt }]);
        responses.push(response);

        // Giliran-giliran berikutnya
        for (let i = 1; i < numTurns; i++) {
            const nextTurnPrompt = `Hasilkan respons lain terhadap prompt masukan asli.\n\nKeluarkan HANYA responsnya, tanpa penjelasan atau teks tambahan.\n\nPrompt: ${task}`;

            // Tambahkan riwayat percakapan ke giliran berikutnya
            const messages = [
                { role: 'user', content: firstTurnPrompt },
                { role: 'assistant', content: response },
                { role: 'user', content: nextTurnPrompt }
            ];

            response = await chatLLM.chat(messages);
            responses.push(response);
        }

        return responses;
    } catch (error) {
        console.error('Error dalam evaluasi penulisan kreatif multi-giliran:', error);
        return [`Error: Gagal menghasilkan respons - ${(error as Error).message}`];
    }
}

// Contoh penggunaan untuk berbagai jenis tugas penulisan kreatif
async function runCreativeWritingSamplingDemo() {
    console.log('=== Demo Penulisan Kreatif dengan Sampling dan Multi-giliran ===\n');

    // Contoh tugas untuk sampling
    console.log('1. Membuat Puisi (dengan Sampling - 3 respons):');
    const poemTask = "Tulis sebuah puisi tentang keindahan alam di pagi hari";
    const poemSamplingResults = await evaluateCreativeWritingSampling(poemTask, 50, 3);
    poemSamplingResults.forEach((result, index) => {
        console.log(`Puisi ${index + 1}:`);
        console.log(result);
        console.log('');
    });
    console.log('='.repeat(50) + '\n');

    // Contoh tugas untuk multi-giliran
    console.log('2. Membuat Cerita (dengan Multi-giliran - 2 respons):');
    const storyTask = "Tulis cerita pendek tentang seorang anak yang menemukan portal menuju dunia ajaib";
    const storyMultiTurnResults = await evaluateCreativeWritingMultiTurn(storyTask, 100, 2);
    storyMultiTurnResults.forEach((result, index) => {
        console.log(`Respons Multi-giliran ${index + 1}:`);
        console.log(result);
        console.log('');
    });
    console.log('='.repeat(50) + '\n');

    console.log('Demo Sampling dan Multi-giliran selesai!');
}

// Menjalankan demo
runCreativeWritingSamplingDemo().catch(console.error);

export { evaluateCreativeWritingSampling, evaluateCreativeWritingMultiTurn, runCreativeWritingSamplingDemo };