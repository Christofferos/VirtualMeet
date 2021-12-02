import { NavigationBar } from './components/NavigationBar';
import { VideoChatScreen } from './screens/VideoChatScreen';

export const App = () => {
  return (
    <div className="App">
      <NavigationBar />
      <VideoChatScreen />
    </div>
  );
};
