import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import logo from "@/assets/tradewise-logo.png";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.5-4.39 2.89 2.89 0 0 1 3.17-.93v-3.5a6.37 6.37 0 0 0-1.16-.11 6.44 6.44 0 0 0-4.7 10.3 6.44 6.44 0 0 0 9.06.27 6.5 6.5 0 0 0 1.7-4.72V9.06a8.4 8.4 0 0 0 4.63 1.42V7.17z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-secondary/40 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <img src={logo} alt="Tradewise" className="h-14 w-auto mb-3" />
          <p className="text-sm text-muted-foreground">Trade smart. Grow everywhere. Your trusted marketplace for quality products.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/categories" className="hover:text-primary">All Products</Link></li>
            <li><Link to="/categories" className="hover:text-primary">Categories</Link></li>
            <li><Link to="/cart" className="hover:text-primary">My Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/login" className="hover:text-primary">Login</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Connect</h4>
          <div className="flex gap-3">
            {[
              { Icon: Facebook, href: "https://www.facebook.com/profile.php?fb_profile_edit_entry_point=%7B%22click_point%22%3A%22edit_profile_button%22%2C%22feature%22%3A%22profile_header%22%7D&id=61590592347027&sk=about", label: "Facebook" },
              { Icon: Twitter, href: "https://x.com/tradewiserwanda", label: "X" },
              { Icon: Instagram, href: "https://www.instagram.com/tradewise676/?hl=en", label: "Instagram" },
              { Icon: TikTokIcon, href: "https://www.tiktok.com/@tradewise01?lang=en", label: "TikTok" },
              { Icon: Mail, href: "mailto:tradewise@tradewise.rw", label: "Email" },
            ].map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground space-y-1">
        <div>© {new Date().getFullYear()} Tradewise. All rights reserved.</div>
        <div>
          MADE WITH{" "}
          <a
            href="https://api.whatsapp.com/send?phone=250786989552&text=Hello!%20I%20am%20interested%20in%20your%20services.%20Can%20you%20build%20websites%2C%20mobile%20apps%2C%20handle%20SEO%2C%20professional%20emails%2C%20or%20other%20tech%20solutions%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            INFINITY HOLDINGS
          </a>
        </div>
      </div>
    </footer>
  );
}
