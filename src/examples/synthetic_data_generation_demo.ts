import { runMathSimpleSampling } from './math_simple_sampling_demo';
import { runMathCompetitionSampling } from './math_competition_sampling_demo';
import { runProgrammingChallengeSampling } from './programming_challenge_sampling_demo';

// Contoh penggunaan gabungan dari ketiga jenis sampling data sintetis
async function main() {
    console.log("Contoh Gabungan: Generasi Data Sintetis dengan MicroAgent");
    console.log("=========================================================");

    // Contoh prompt untuk matematika sederhana
    const mathSimplePrompt = "Hasilkan soal cerita matematika tingkat sekolah dasar yang melibatkan urutan perhitungan aritmatika dasar (penjumlahan, pengurangan, perkalian, pembagian).";
    const numSamplings = 2;
    const targetWords = 50;

    console.log(`\n1. Sampling Matematika Sederhana:`);
    console.log(`Input Prompt: ${mathSimplePrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWords}`);
    console.log("\nSedang menghasilkan respons...\n");

    try {
        const mathSimpleResult = await runMathSimpleSampling(mathSimplePrompt, numSamplings, targetWords);

        console.log("Hasil Sampling Matematika Sederhana:");
        console.log("=====================================");

        if (mathSimpleResult.responses && Array.isArray(mathSimpleResult.responses)) {
            mathSimpleResult.responses.forEach((response: any, index: number) => {
                console.log(`\nRespons ${index + 1} (Probabilitas: ${(response.probability || 0).toFixed(2)}):`);
                console.log(response.text || response);
            });
        } else {
            console.log("Tidak ada respons yang dihasilkan atau format tidak valid.");
        }
    } catch (error) {
        console.error("Error saat menjalankan sampling matematika sederhana:", error);
    }

    // Contoh prompt untuk matematika kompetisi
    const mathCompetitionPrompt = "Hasilkan soal kompetisi matematika dengan gaya AMC 10, AMC 12, atau AIME.";
    const targetWordsMathComp = 80;

    console.log(`\n2. Sampling Matematika Kompetisi:`);
    console.log(`Input Prompt: ${mathCompetitionPrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWordsMathComp}`);
    console.log("\nSedang menghasilkan respons...\n");

    try {
        const mathCompetitionResult = await runMathCompetitionSampling(mathCompetitionPrompt, numSamplings, targetWordsMathComp);

        console.log("Hasil Sampling Matematika Kompetisi:");
        console.log("=====================================");

        if (mathCompetitionResult.responses && Array.isArray(mathCompetitionResult.responses)) {
            mathCompetitionResult.responses.forEach((response: any, index: number) => {
                console.log(`\nRespons ${index + 1} (Probabilitas: ${(response.probability || 0).toFixed(2)}):`);
                console.log(response.text || response);
            });
        } else {
            console.log("Tidak ada respons yang dihasilkan atau format tidak valid.");
        }
    } catch (error) {
        console.error("Error saat menjalankan sampling matematika kompetisi:", error);
    }

    // Contoh prompt untuk tantangan pemrograman
    const programmingChallengePrompt = "Hasilkan tantangan pemrograman dengan gaya platform pemrograman kompetitif (misalnya, LeetCode, AtCoder, Codeforces).";
    const targetWordsProg = 100;

    console.log(`\n3. Sampling Tantangan Pemrograman:`);
    console.log(`Input Prompt: ${programmingChallengePrompt}`);
    console.log(`Jumlah Sampling: ${numSamplings}`);
    console.log(`Target Kata: ${targetWordsProg}`);
    console.log("\nSedang menghasilkan respons...\n");

    try {
        const programmingChallengeResult = await runProgrammingChallengeSampling(programmingChallengePrompt, numSamplings, targetWordsProg);

        console.log("Hasil Sampling Tantangan Pemrograman:");
        console.log("=====================================");

        if (programmingChallengeResult.responses && Array.isArray(programmingChallengeResult.responses)) {
            programmingChallengeResult.responses.forEach((response: any, index: number) => {
                console.log(`\nRespons ${index + 1} (Probabilitas: ${(response.probability || 0).toFixed(2)}):`);
                console.log(response.text || response);
            });
        } else {
            console.log("Tidak ada respons yang dihasilkan atau format tidak valid.");
        }
    } catch (error) {
        console.error("Error saat menjalankan sampling tantangan pemrograman:", error);
    }
}

// Jalankan contoh jika file ini dijalankan langsung
if (require.main === module) {
    main().catch(console.error);
}