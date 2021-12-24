import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { NavigationBar } from './components/NavigationBar';
import { BattletronicsGameScreen } from './screens/BattletronicsGameScreen';
import { VideoChatScreen } from './screens/VideoChatScreen';

export const App = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<VideoChatScreen />} />
          <Route path="/game" element={<BattletronicsGameScreen />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};
