import React, { memo, useCallback } from "react";
import {
  Users,
  Package,
  CreditCard,
  Receipt,
  User,
  Shield,
  FileCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Language, Translations } from "@/lib/i18n";

interface TiaHeaderProps {
  isAdmin: boolean;
  currentUser: {
    name: string;
    initials: string;
  };
  onOpenModal: (modalName: string) => void;
  language: Language;
  t: Translations;
}

const TiaHeader = memo<TiaHeaderProps>(
  ({ isAdmin, currentUser, onOpenModal, language, t }) => {
    // Memoized event handlers to prevent unnecessary re-renders
    const handleTeamsClick = useCallback(() => {
      onOpenModal("teams");
    }, [onOpenModal]);

    const handlePlanClick = useCallback(
      (planType: string) => {
        onOpenModal(planType);
      },
      [onOpenModal],
    );

    const handleUserMenuClick = useCallback(
      (menuType: string) => {
        if (menuType === "logout") {
          if (confirm("Are you sure you want to log out?")) {
            // Implement logout logic
            console.log("Logging out...");
          }
        } else {
          onOpenModal(menuType);
        }
      },
      [onOpenModal],
    );

    return (
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b-2 border-blue-100 dark:border-blue-800 px-6 py-2 flex items-center justify-between relative z-50 transition-colors duration-200">
        <div className="flex items-center space-x-6">
          {/* Company Logo - clickable */}
          <button
            onClick={() => window.open("https://softia.ca", "_blank")}
            className="flex items-center space-x-3 group hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">
              Softia
            </span>
          </button>

          <Separator orientation="vertical" className="h-6" />

          {/* Navigation with enhanced accessibility */}
          <nav className="flex items-center space-x-6" role="navigation">
            {isAdmin && (
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 flex items-center gap-2 transition-colors duration-200"
                onClick={handleTeamsClick}
                aria-label={`Open ${t.teams} management`}
              >
                <Users className="h-4 w-4" />
                {t.teams}
              </Button>
            )}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors duration-200"
                    aria-label={`Open ${t.yourPlan} menu`}
                  >
                    {t.yourPlan}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50 min-w-[200px]">
                  <DropdownMenuLabel>Plan Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handlePlanClick("currentPlan")}
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {t.currentPlan}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePlanClick("availablePackages")}
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t.availablePackages}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handlePlanClick("viewBills")}
                    className="cursor-pointer"
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    {t.viewBills}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        {/* Enhanced User Profile Section */}
        <div className="flex items-center space-x-4">
          {/* Tia Branding - moved to right side */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
              <span className="font-bold text-xs">Tia</span>
            </div>
            <div>
              <div className="font-semibold text-sm">Tia</div>
              <div className="text-xs opacity-90">v2.1.0</div>
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {currentUser.name}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-blue-200 hover:ring-blue-400 transition-all duration-200 hover:scale-105">
                <AvatarImage src="" alt={`${currentUser.name} avatar`} />
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-50 min-w-[180px]"
              sideOffset={5}
            >
              <DropdownMenuLabel>{t.myAccount}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUserMenuClick("userProfile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                {t.profile}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUserMenuClick("security")}
                className="cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                {t.security}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleUserMenuClick("terms")}
                className="cursor-pointer"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                {t.termsOfUse}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleUserMenuClick("logout")}
                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.logOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    );
  },
);

TiaHeader.displayName = "TiaHeader";

export default TiaHeader;
