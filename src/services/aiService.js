const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';

// Free models that work well for our use cases
const SUMMARIZATION_MODEL = 'facebook/bart-large-cnn';
const QUESTION_GENERATION_MODEL = 't5-base';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callHuggingFaceAPI = async (model, inputs, retries = 3) => {
  const url = `${HUGGINGFACE_API_URL}${model}`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ inputs }),
      });

      const result = await response.json();
      
      if (result.error && result.error.includes('loading')) {
        // Model is loading, wait and retry
        await delay(2000 * (attempt + 1));
        continue;
      }

      if (response.ok && result && !result.error) {
        return result;
      }

      throw new Error(result.error || 'API call failed');
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await delay(1000 * (attempt + 1));
    }
  }
};

export const summarizeText = async (text) => {
  try {
    // Truncate text if too long (BART has a max input length)
    const maxLength = 1024;
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    const result = await callHuggingFaceAPI(SUMMARIZATION_MODEL, truncatedText);
    
    if (result && result[0] && result[0].summary_text) {
      return result[0].summary_text;
    }
    
    // Fallback: create a simple extractive summary
    return createExtractiveSummary(text);
  } catch (error) {
    console.error('Summarization error:', error);
    return createExtractiveSummary(text);
  }
};

export const generateQuestions = async (text) => {
  try {
    // For question generation, we'll use a simpler approach due to API limitations
    // Create context-based questions using keywords and patterns
    return generateSimpleQuestions(text);
  } catch (error) {
    console.error('Question generation error:', error);
    return generateSimpleQuestions(text);
  }
};

// Fallback summarization method
const createExtractiveSummary = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length <= 3) {
    return text;
  }
  
  // Simple scoring based on sentence length and position
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    
    // Favor sentences at beginning and end
    if (index < sentences.length * 0.3) score += 2;
    if (index > sentences.length * 0.7) score += 1;
    
    // Favor medium-length sentences
    if (sentence.length > 50 && sentence.length < 200) score += 2;
    
    // Look for important keywords
    const keywords = ['important', 'significant', 'key', 'main', 'primary', 'conclusion', 'result'];
    keywords.forEach(keyword => {
      if (sentence.toLowerCase().includes(keyword)) score += 1;
    });
    
    return { sentence: sentence.trim(), score, index };
  });
  
  // Sort by score and take top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, Math.ceil(sentences.length * 0.3)))
    .sort((a, b) => a.index - b.index);
  
  return topSentences.map(item => item.sentence).join('. ') + '.';
};

// Simple question generation based on text analysis
const generateSimpleQuestions = (text) => {
  const questions = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Question templates and patterns
  const templates = [
    'What is the main purpose of this text?',
    'What are the key points discussed?',
    'How does this relate to the broader context?',
    'What conclusions can be drawn?',
    'What evidence supports the main arguments?'
  ];
  
  // Extract key topics/entities (simple approach)
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  // Generate questions based on content
  if (topWords.length > 0) {
    questions.push(`What role does ${topWords[0]} play in this context?`);
  }
  
  // Add template questions
  questions.push(...templates.slice(0, 4));
  
  // Generate specific questions based on sentence structure
  sentences.slice(0, 2).forEach(sentence => {
    if (sentence.toLowerCase().includes('because') || sentence.toLowerCase().includes('due to')) {
      questions.push('What are the causes mentioned in the text?');
    }
    if (sentence.toLowerCase().includes('result') || sentence.toLowerCase().includes('consequence')) {
      questions.push('What are the main outcomes or results discussed?');
    }
  });
  
  return questions.slice(0, 6);
};