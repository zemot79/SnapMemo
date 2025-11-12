import { Share2, User, Info, MessageCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import logo from "@/assets/logo.png";

export const Header = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="SnapMemo Logo" className="w-16 h-16 object-contain" />
            <h1 className="text-2xl font-bold font-display text-foreground">SnapMemo</h1>
          </Link>
          
          <Link to="/">
            <Button variant="default" size="sm" className="uppercase tracking-wider">
              Create Video
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-6">
          <NavigationMenu className="max-w-full justify-between py-0">
            <NavigationMenuList className="gap-0">
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  className="px-6 py-3 text-sm font-medium uppercase tracking-wider text-foreground hover:bg-accent/10 transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Go Social
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-6 py-3 text-sm font-medium uppercase tracking-wider">
                  <Info className="w-4 h-4 mr-2" />
                  Informations
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-64 p-4 space-y-2">
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm">
                      About SnapMemo
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm">
                      How it Works
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm">
                      FAQ
                    </a>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  className="px-6 py-3 text-sm font-medium uppercase tracking-wider text-foreground hover:bg-accent/10 transition-colors inline-flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/pricing">
                  <NavigationMenuLink
                    className="px-6 py-3 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 transition-all inline-flex items-center gap-2 relative group"
                  >
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Go Premium
                    </span>
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 h-5">
                      $1/mo
                    </Badge>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-6 py-3 text-sm font-medium uppercase tracking-wider">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-64 p-4 space-y-2">
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm font-semibold">
                      Sign In
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm font-semibold">
                      Register
                    </a>
                    <div className="border-t border-border my-2"></div>
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm">
                      My Projects
                    </a>
                    <a href="#" className="block px-4 py-2 hover:bg-accent/10 rounded transition-colors text-sm">
                      Settings
                    </a>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
};
