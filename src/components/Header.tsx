import { Film, Share2, User, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const Header = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      {/* Main Header */}
      <div className="container mx-auto px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">SnapMemo</h1>
          </div>
          
          <Button variant="default" size="sm" className="uppercase tracking-wider">
            Create Video
          </Button>
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
