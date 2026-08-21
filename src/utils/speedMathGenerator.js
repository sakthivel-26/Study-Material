export function generateSimplificationSet(count = 30) {
  const questions = [];
  const operators = ["+", "-", "×", "÷"];

  for (let i = 0; i < count; i++) {
    // Basic types of simplification
    const type = Math.floor(Math.random() * 4);
    let questionText = "";
    let correctAnswer = 0;

    if (type === 0) {
      // Percentage based: X% of Y + Z
      const pct = (Math.floor(Math.random() * 9) + 1) * 5; // 5, 10, ... 45
      const base = (Math.floor(Math.random() * 10) + 2) * 50; // 100, 150...
      const add = Math.floor(Math.random() * 50) + 10;
      correctAnswer = (pct / 100) * base + add;
      questionText = `${pct}% of ${base} + ${add} = ?`;
    } else if (type === 1) {
      // Squares and Cubes: X^2 - Y^2
      const x = Math.floor(Math.random() * 20) + 10;
      const y = Math.floor(Math.random() * 10) + 5;
      correctAnswer = (x * x) - (y * y);
      questionText = `${x}² - ${y}² = ?`;
    } else if (type === 2) {
      // BODMAS: X × Y + Z ÷ W
      const x = Math.floor(Math.random() * 12) + 2;
      const y = Math.floor(Math.random() * 10) + 2;
      const w = Math.floor(Math.random() * 5) + 2;
      const z = w * (Math.floor(Math.random() * 10) + 1); // divisible by w
      correctAnswer = (x * y) + (z / w);
      questionText = `${x} × ${y} + ${z} ÷ ${w} = ?`;
    } else {
      // Fractions: (a/b) of X
      const b = Math.floor(Math.random() * 5) + 2; // 2 to 6
      const a = Math.floor(Math.random() * (b - 1)) + 1; // 1 to b-1
      const x = b * (Math.floor(Math.random() * 20) + 10); // divisible by b
      correctAnswer = (a / b) * x;
      questionText = `(${a}/${b}) of ${x} = ?`;
    }

    // Generate 4 plausible wrong options
    const options = [correctAnswer];
    while (options.length < 5) {
      const variance = Math.floor(Math.random() * 20) - 10; // -10 to +10
      const wrongOpt = correctAnswer + variance;
      if (!options.includes(wrongOpt) && wrongOpt > 0) {
        options.push(wrongOpt);
      }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);

    questions.push({
      section: "Simplification",
      question: questionText,
      options: options.map(String),
      correctAnswerIndex: correctIndex,
      explanation: `Correct Answer: ${correctAnswer}`,
    });
  }

  return questions;
}

export function generateApproximationSet(count = 30) {
  const questions = [];

  for (let i = 0; i < count; i++) {
    const type = Math.floor(Math.random() * 3);
    let questionText = "";
    let correctAnswer = 0;

    if (type === 0) {
      // Decimal addition/subtraction
      const aInt = Math.floor(Math.random() * 50) + 20;
      const aDec = (Math.random() * 0.1).toFixed(2); // close to 0
      const aStr = (aInt + parseFloat(aDec)).toFixed(2);

      const bInt = Math.floor(Math.random() * 30) + 10;
      const bDec = (Math.random() * 0.1 - 0.05 + 0.95).toFixed(2); // close to 1
      const bStr = (bInt + parseFloat(bDec)).toFixed(2);

      const cInt = Math.floor(Math.random() * 20) + 5;
      const cDec = (Math.random() * 0.1).toFixed(2);
      const cStr = (cInt + parseFloat(cDec)).toFixed(2);

      correctAnswer = Math.round(parseFloat(aStr)) + Math.round(parseFloat(bStr)) - Math.round(parseFloat(cStr));
      questionText = `${aStr} + ${bStr} - ${cStr} = ?`;
    } else if (type === 1) {
      // Percentages of decimals
      const pctInt = (Math.floor(Math.random() * 4) + 1) * 10; // 10, 20, 30, 40
      const pctDec = (Math.random() * 0.1 - 0.05).toFixed(2); 
      const pctStr = (pctInt + parseFloat(pctDec)).toFixed(2);

      const baseInt = (Math.floor(Math.random() * 10) + 2) * 50; 
      const baseDec = (Math.random() * 0.2 - 0.1).toFixed(2);
      const baseStr = (baseInt + parseFloat(baseDec)).toFixed(2);

      correctAnswer = Math.round((Math.round(parseFloat(pctStr)) / 100) * Math.round(parseFloat(baseStr)));
      questionText = `${pctStr}% of ${baseStr} = ?`;
    } else {
      // Squares
      const x = Math.floor(Math.random() * 15) + 10;
      const xDec = (Math.random() * 0.1 - 0.05).toFixed(2);
      const xStr = (x + parseFloat(xDec)).toFixed(2);

      correctAnswer = Math.round(parseFloat(xStr)) * Math.round(parseFloat(xStr));
      questionText = `(${xStr})² = ?`;
    }

    // Generate 4 plausible wrong options
    const options = [correctAnswer];
    while (options.length < 5) {
      const variance = Math.floor(Math.random() * 10) - 5; 
      const wrongOpt = correctAnswer + (variance === 0 ? 1 : variance);
      if (!options.includes(wrongOpt) && wrongOpt > 0) {
        options.push(wrongOpt);
      }
    }

    options.sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);

    questions.push({
      section: "Approximation",
      question: questionText,
      options: options.map(String),
      correctAnswerIndex: correctIndex,
      explanation: `Round off the decimals first. Correct Answer: ${correctAnswer}`,
    });
  }

  return questions;
}
