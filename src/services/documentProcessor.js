import mammoth from 'mammoth';

export const extractTextFromFile = async (file) => {
  const fileType = file.type;
  
  switch (fileType) {
    case 'application/pdf':
      return await extractTextFromPDF(file);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractTextFromDOCX(file);
    case 'text/plain':
      return await extractTextFromTXT(file);
    default:
      throw new Error('Unsupported file type');
  }
};

const extractTextFromPDF = async (file) => {
  // For PDF processing in the browser, we'll use a simpler approach
  // Since pdf-parse might not work directly in browser environment
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // This is a simplified approach - in a real implementation,
        // you might want to use PDF.js or a similar library
        const arrayBuffer = event.target.result;
        
        // For now, we'll prompt the user to copy-paste the text
        // In a production environment, you'd want to implement proper PDF parsing
        resolve("PDF text extraction requires server-side processing. Please copy and paste the text from your PDF into the text input area.");
      } catch (error) {
        reject(new Error('Failed to process PDF file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromDOCX = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (result.value && result.value.trim()) {
          resolve(result.value);
        } else {
          reject(new Error('No text content found in the document'));
        }
      } catch (error) {
        reject(new Error('Failed to process DOCX file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read DOCX file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromTXT = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (text && text.trim()) {
        resolve(text);
      } else {
        reject(new Error('No text content found in the file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};