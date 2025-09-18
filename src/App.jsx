import { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TextInput from './components/TextInput';
import ResultsPanel from './components/ResultsPanel';
import LoadingSpinner from './components/LoadingSpinner';
import { summarizeText, generateQuestions } from './services/aiService';
import { extractTextFromFile } from './services/documentProcessor';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleTextSubmit = async (text) => {
    if (!text.trim()) {
      setError('Please enter some text to summarize.');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setQuestions([]);

    try {
      // Run summarization and question generation in parallel
      const [summaryResult, questionsResult] = await Promise.all([
        summarizeText(text),
        generateQuestions(text)
      ]);

      setSummary(summaryResult);
      setQuestions(questionsResult);
    } catch (err) {
      setError('Failed to process text. Please try again.');
      console.error('AI processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError('');

    try {
      const extractedText = await extractTextFromFile(file);
      setInputText(extractedText);
      setActiveTab('text');
      
      // Auto-process the extracted text
      await handleTextSubmit(extractedText);
    } catch (err) {
      setError('Failed to extract text from file. Please try again.');
      console.error('File processing error:', err);
      setLoading(false);
    }
  };

  const clearAll = () => {
    setInputText('');
    setSummary('');
    setQuestions([]);
    setError('');
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              📝 Text Input
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📄 Upload File
            </button>
          </div>

          <div className="content-area">
            {activeTab === 'text' ? (
              <TextInput 
                value={inputText}
                onChange={setInputText}
                onSubmit={() => handleTextSubmit(inputText)}
                loading={loading}
              />
            ) : (
              <FileUpload 
                onFileUpload={handleFileUpload}
                loading={loading}
              />
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {loading && <LoadingSpinner />}

            {(summary || questions.length > 0) && (
              <ResultsPanel 
                summary={summary}
                questions={questions}
                onClear={clearAll}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;