import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { GuestPreCheckIn } from './pages/GuestPreCheckIn';
import { GuestKeyGate } from './pages/GuestKeyGate';
import { StaffPanel } from './pages/StaffPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/check-in/:bookingCode" element={<GuestPreCheckIn />} />
        <Route path="/key-gate/:bookingCode" element={<GuestKeyGate />} />
        <Route path="/staff" element={<StaffPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
