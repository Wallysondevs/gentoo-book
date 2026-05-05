import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Home from "@/pages/Home";
import Chapter from "@/pages/Chapter";
import NotFound from "@/pages/NotFound";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router hook={useHashLocation}>
      <div className="min-h-screen flex flex-col">
        <Header onMenu={() => setMenuOpen(true)} />
        <div className="flex-1 flex">
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          <main className="flex-1 min-w-0">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/c/:slug" component={Chapter} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </Router>
  );
}
