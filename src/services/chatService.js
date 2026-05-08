import axios from 'axios';

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
const CHAT_STORAGE_KEY = 'chatbot_history';
const MAX_CHATS = 30;

export const getChatHistory = () => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const saveChatHistory = (messages) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_CHATS)));
  } catch {}
};

export const clearChatHistory = () => {
  localStorage.removeItem(CHAT_STORAGE_KEY);
};

/**
 * Local fallback: answer common questions using dashboard data directly
 */
const localAnswer = (userMessage, issData, newsData) => {
  const q = userMessage.toLowerCase().trim();

  // Greetings — highest priority
  if (/^(hi+|hello|hey|hii+|yo|sup)[\s!?.]*$/i.test(q)) {
    return 'Hello! How can I help you with the ISS or News data?';
  }

  // News questions — check before ISS so "latest news" isn't caught by ISS
  if (q.includes('news') || q.includes('headline') || q.includes('article') || q.includes('breaking') || q.includes('latest')) {
    if (newsData && newsData.length > 0) {
      const summaries = newsData.slice(0, 5).map((a, i) => `${i + 1}. "${a.title}" — ${a.source}`).join('\n');
      return `Here are the latest headlines:\n${summaries}`;
    }
    return 'No news articles loaded yet.';
  }

  // ISS location questions
  if (q.includes('where') || q.includes('location') || q.includes('position') || q.includes('lat') || q.includes('lon') || q.includes('iss')) {
    if (issData?.position) {
      const { latitude, longitude } = issData.position;
      let answer = `The ISS is currently at Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}.`;
      if (issData.location) answer += ` Near: ${issData.location}.`;
      if (issData.speed) answer += ` Speed: ${issData.speed.toFixed(2)} km/h.`;
      if (issData.trackedPositions) answer += ` Tracked positions: ${issData.trackedPositions}.`;
      return answer;
    }
    return 'ISS data is still loading. Please try again in a moment.';
  }

  // Speed questions
  if (q.includes('speed') || q.includes('fast') || q.includes('velocity') || q.includes('km')) {
    if (issData?.speed !== undefined) {
      return `The ISS is currently traveling at ${issData.speed.toFixed(2)} km/h (approximately ${(issData.speed / 3.6).toFixed(0)} m/s).`;
    }
    return 'Speed data is still being calculated. Please wait for more position updates.';
  }

  // Astronaut questions
  if (q.includes('astronaut') || q.includes('crew') || q.includes('people') || q.includes('who')) {
    if (issData?.astronauts) {
      const names = issData.astronauts.people.map(p => `${p.name} (${p.craft})`).join(', ');
      return `There are ${issData.astronauts.number} people in space: ${names}.`;
    }
    return 'Astronaut data is not available yet.';
  }

  // Dashboard data question
  if (q.includes('dashboard') || q.includes('data') || q.includes('provide') || q.includes('show') || q.includes('tell') || q.includes('all')) {
    let answer = '';
    if (issData?.position) {
      answer += `ISS Position: ${issData.position.latitude.toFixed(4)}, ${issData.position.longitude.toFixed(4)}. `;
      if (issData.speed) answer += `Speed: ${issData.speed.toFixed(2)} km/h. `;
      if (issData.location) answer += `Location: ${issData.location}. `;
    }
    if (newsData && newsData.length > 0) {
      answer += `\nNews: ${newsData.length} articles loaded. Top: "${newsData[0].title}" — ${newsData[0].source}.`;
    }
    return answer || 'Dashboard data is still loading.';
  }

  // Default
  return 'I only know dashboard data. Ask me about ISS location, speed, astronauts, or news headlines.';
};

/**
 * Build context for HuggingFace API
 */
const buildContext = (issData, newsData) => {
  let context = 'You are an AI assistant for the ISS Dashboard. You ONLY answer questions using the dashboard data provided below. If the answer is not available in the data, respond with: "I only know dashboard data."\n\n';

  if (issData) {
    context += '=== ISS DATA ===\n';
    if (issData.position) context += `Current ISS Position: Latitude ${issData.position.latitude}, Longitude ${issData.position.longitude}\n`;
    if (issData.speed !== undefined) context += `Current ISS Speed: ${issData.speed} km/h\n`;
    if (issData.location) context += `Nearest Location: ${issData.location}\n`;
    if (issData.astronauts) {
      context += `Total Astronauts in Space: ${issData.astronauts.number}\n`;
      context += `Astronauts: ${issData.astronauts.people.map(p => `${p.name} (${p.craft})`).join(', ')}\n`;
    }
    if (issData.trackedPositions) context += `Tracked Positions Count: ${issData.trackedPositions}\n`;
    context += '\n';
  }

  if (newsData && newsData.length > 0) {
    context += '=== NEWS DATA ===\n';
    newsData.forEach((article, i) => {
      context += `Article ${i + 1}: "${article.title}" by ${article.source} (${new Date(article.publishedAt).toLocaleDateString()})\n`;
      if (article.description) context += `  Description: ${article.description}\n`;
    });
    context += '\n';
  }

  return context;
};

/**
 * Send message — tries HuggingFace API first, falls back to local assistant
 */
export const sendMessage = async (userMessage, issData, newsData) => {
  const token = import.meta.env.VITE_AI_TOKEN;

  // If no valid token, use local fallback immediately
  if (!token || token.length < 10) {
    return localAnswer(userMessage, issData, newsData);
  }

  // Try HuggingFace API
  try {
    const context = buildContext(issData, newsData);
    const prompt = `<s>[INST] ${context}\n\nUser Question: ${userMessage} [/INST]`;

    const response = await axios.post(
      HF_API_URL,
      {
        inputs: prompt,
        parameters: { max_new_tokens: 300, temperature: 0.7, top_p: 0.9, return_full_text: false },
      },
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    if (response.data && response.data[0]?.generated_text) {
      const text = response.data[0].generated_text.trim();
      return text || localAnswer(userMessage, issData, newsData);
    }

    // No response from API, use local
    return localAnswer(userMessage, issData, newsData);
  } catch {
    // API failed — silently fall back to local assistant
    return localAnswer(userMessage, issData, newsData);
  }
};
