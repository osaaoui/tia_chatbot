import React, { memo, useCallback, useRef } from "react";
import {
  Search,
  Send,
  Save,
  Upload,
  X,
  Menu,
  Eye,
  Settings,
  Globe,
  Type,
  Palette,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChatMessage,
  SavedChat,
  AppSettings,
  ChatMessage as AppChatMessage, // Renaming to avoid conflict if ChatMessage is defined locally
} from "@/hooks/use-optimized-tia-app";
import { useSearch } from "@/hooks/use-optimized-tia-app";
import { Language, Translations } from "@/lib/i18n";
// Import new request/response types and the service
import { queryDocuments, ApiQueryRequestData, ApiQueryResponseData, ApiSourceDocumentData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Define ChatMessage type if it's not already globally available or needs specific fields here
// For now, assuming AppChatMessage from use-optimized-tia-app is sufficient.
// If not, it might be:
// interface ChatMessage {
//   id: string;
//   type: "user" | "bot";
//   content: string;
//   timestamp: string;
//   documentReferences?: ApiSourceDocumentData[]; // Updated to use new type
// }


interface ChatInterfaceProps {
  chatState: {
    messages: AppChatMessage[]; // Use AppChatMessage from use-optimized-tia-app
    currentMessage: string;
    currentChatId: string;
  };
  // chatState: { // Removed duplicate
  //   messages: ChatMessage[];
  //   currentMessage: string;
  //   currentChatId: string;
  // };
  savedChats: SavedChat[];
  settings: AppSettings;
  dragState: {
    draggedDocument: { docId: string; fromDbId: string } | null;
    dragOver: string | null;
    chatDragOver: boolean;
    isDraggingFiles: boolean;
  };
  columnStates: {
    showColumn1: boolean;
    showColumn2: boolean;
  };
  onChatAction: React.Dispatch<
    React.SetStateAction<{
      messages: ChatMessage[];
      currentMessage: string;
      currentChatId: string;
    }>
  >;
  onSavedChatsAction: React.Dispatch<React.SetStateAction<SavedChat[]>>;
  onSettingsChange: (updates: Partial<AppSettings>) => void;
  onToggleColumns: {
    toggleColumn1: () => void;
    toggleColumn2: () => void;
  };
  onFileUpload: (files: FileList | null) => void;
  onDragHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    setChatDragOver: (dragOver: boolean) => void;
  };
  onSelectDocumentReference?: (documentName: string) => void;
  t: Translations;
  currentUserId: string | undefined; // Added from useComponentProps
}

const ChatInterface = memo<ChatInterfaceProps>(
  ({
    chatState,
    savedChats,
    settings,
    dragState,
    columnStates,
    onChatAction,
    onSavedChatsAction,
    onSettingsChange,
    onToggleColumns,
    onFileUpload, // This onFileUpload will need userId for handleChatFileUpload in useFileUpload
    onDragHandlers,
    onSelectDocumentReference,
    t,
    currentUserId, // Destructure currentUserId
  }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    // const userId = "default_user"; // Removed, use currentUserId prop
    const [isBotReplying, setIsBotReplying] = React.useState(false);


    const { searchQuery, filteredData, updateSearchQuery } = useSearch(
      chatState.messages,
    );

    const handleSendMessage = useCallback(async () => {
      const currentMessageContent = chatState.currentMessage.trim();
      if (!currentMessageContent) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: currentMessageContent,
        timestamp: new Date().toISOString(),
      };

      // Add user message to state immediately
      onChatAction((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        currentMessage: "", // Clear input field
      }));

      // Update current chat in saved chats (optimistic update for user message)
      onSavedChatsAction((prevSaved) =>
        prevSaved.map((chat) =>
          chat.id === chatState.currentChatId
            ? { ...chat, messages: [...chat.messages, userMessage] }
            : chat,
        ),
      );

      setIsBotReplying(true);

      if (!currentUserId) {
        toast({
          title: "Authentication Error",
          description: "User ID is not available. Cannot send message.",
          variant: "destructive",
        });
        setIsBotReplying(false);
        return;
      }

      const queryData: ApiQueryRequestData = {
        user_id: currentUserId, // Use currentUserId from props
        question: currentMessageContent,
        // top_k: 5 // Example: if you want to control top_k from frontend, pass it here
      };

      try {
        const backendResponse: ApiQueryResponseData = await queryDocuments(queryData);

        // The AppChatMessage from useOptimizedTiaApp might need its documentReferences field updated
        // to store ApiSourceDocumentData[] or just filenames as strings.
        // For now, let's assume documentReferences in AppChatMessage can store simplified source info (e.g., filenames).
        // If AppChatMessage.documentReferences needs to be richer, its definition in useOptimizedTiaApp should change.

        const botResponseMessage: AppChatMessage = { // Use AppChatMessage
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: backendResponse.answer,
          timestamp: new Date().toISOString(),
          // Store the full ApiSourceDocumentData objects from the backend response
          documentReferences: backendResponse.sources,
        };

        // Add bot message to state
        onChatAction((prev) => ({
          ...prev,
          messages: [...prev.messages, botMessage],
        }));

        // Update current chat in saved chats with bot message
        onSavedChatsAction((prevSaved) =>
          prevSaved.map((chat) =>
            chat.id === chatState.currentChatId
              ? { ...chat, messages: [...chat.messages, botMessage] }
              : chat,
          ),
        );

      } catch (error) {
        console.error("Error querying documents:", error);
        toast({
          title: "Error",
          description: (error as Error)?.message || "Failed to get response from bot.",
          variant: "destructive",
        });
        // Optionally add an error message to the chat
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: "Sorry, I encountered an error trying to respond.",
          timestamp: new Date().toISOString(),
        };
        onChatAction((prev) => ({
             ...prev, messages: [...prev.messages, errorMessage]
        }));
      } finally {
        setIsBotReplying(false);
      }
    }, [chatState, onChatAction, onSavedChatsAction, toast, userId]);

    const handleSaveConversation = useCallback(() => {
      const chatName =
        prompt(`${t.chatSessionName}:`) ||
        `${t.chatSessionName} ${savedChats.length + 1}`;

      const newChat: SavedChat = {
        id: Date.now().toString(),
        name: chatName,
        messages: chatState.messages,
        createdDate: new Date().toISOString().split("T")[0],
      };

      onSavedChatsAction((prev) => [...prev, newChat]);
      onChatAction((prev) => ({ ...prev, currentChatId: newChat.id }));
    }, [
      chatState.messages,
      onChatAction,
      onSavedChatsAction,
      savedChats.length,
      t.chatSessionName,
    ]);

    const loadSavedChat = useCallback(
      (chatId: string) => {
        const chat = savedChats.find((c) => c.id === chatId);
        if (chat) {
          onChatAction((prev) => ({
            ...prev,
            messages: chat.messages,
            currentChatId: chatId,
          }));
        }
      },
      [savedChats, onChatAction],
    );

    const deleteChatMessage = useCallback(
      (messageId: string) => {
        const updatedMessages = chatState.messages.filter(
          (m) => m.id !== messageId,
        );
        onChatAction((prev) => ({ ...prev, messages: updatedMessages }));

        onSavedChatsAction((prev) =>
          prev.map((chat) =>
            chat.id === chatState.currentChatId
              ? { ...chat, messages: updatedMessages }
              : chat,
          ),
        );
      },
      [
        chatState.messages,
        chatState.currentChatId,
        onChatAction,
        onSavedChatsAction,
      ],
    );

    const formatTimestamp = useCallback((timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }, []);

    React.useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [filteredData]);

    return (
      <div
        className="flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-lg"
        style={{
          width:
            columnStates.showColumn1 || columnStates.showColumn2
              ? "55%"
              : "100%",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!columnStates.showColumn1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleColumns.toggleColumn1}
                  className="text-white hover:bg-white/20"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              {!columnStates.showColumn2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleColumns.toggleColumn2}
                  className="text-white hover:bg-white/20"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <h2 className="font-semibold">{t.chatWithTia}</h2>
            </div>

            <div className="flex items-center space-x-2">
              {/* Chat Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.searchChat}
                  className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/70 w-48"
                  value={searchQuery}
                  onChange={(e) => updateSearchQuery(e.target.value)}
                />
              </div>

              {/* Saved Chats */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {t.savedChats}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50">
                  <DropdownMenuLabel>Chat Sessions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedChats.map((chat) => (
                    <DropdownMenuItem
                      key={chat.id}
                      onClick={() => loadSavedChat(chat.id)}
                      className={
                        chatState.currentChatId === chat.id ? "bg-blue-50" : ""
                      }
                    >
                      <div className="flex flex-col">
                        <span>{chat.name}</span>
                        <span className="text-xs text-gray-500">
                          {chat.createdDate}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSaveConversation}>
                    <Save className="mr-2 h-4 w-4" />
                    {t.saveCurrent}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 w-64">
                  <DropdownMenuLabel>{t.settings}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Language Selection */}
                  <div className="p-2">
                    <Label className="text-sm font-medium">{t.language}</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: Language) =>
                        onSettingsChange({ language: value })
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Font Size */}
                  <div className="p-2">
                    <Label className="text-sm font-medium">
                      {t.fontSize}: {settings.fontSize}px
                    </Label>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) =>
                        onSettingsChange({ fontSize: value[0] })
                      }
                      max={24}
                      min={12}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <DropdownMenuSeparator />

                  {/* Theme Selection */}
                  <div className="p-2">
                    <Label className="text-sm font-medium">
                      {t.appearance}
                    </Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value: "light" | "dark" | "auto") =>
                        onSettingsChange({ theme: value })
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t.light}</SelectItem>
                        <SelectItem value="dark">{t.dark}</SelectItem>
                        <SelectItem value="auto">{t.auto}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Privacy Settings */}
                  <div className="p-2 space-y-3">
                    <Label className="text-sm font-medium">
                      {t.privacySettings}
                    </Label>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{t.shareUsage}</Label>
                      <Switch
                        checked={settings.privacySettings.shareUsage}
                        onCheckedChange={(checked) =>
                          onSettingsChange({
                            privacySettings: {
                              ...settings.privacySettings,
                              shareUsage: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{t.saveHistory}</Label>
                      <Switch
                        checked={settings.privacySettings.saveHistory}
                        onCheckedChange={(checked) =>
                          onSettingsChange({
                            privacySettings: {
                              ...settings.privacySettings,
                              saveHistory: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{t.allowAnalytics}</Label>
                      <Switch
                        checked={settings.privacySettings.allowAnalytics}
                        onCheckedChange={(checked) =>
                          onSettingsChange({
                            privacySettings: {
                              ...settings.privacySettings,
                              allowAnalytics: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredData.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2",
                  message.type === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.type === "bot" && (
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">Tia</span>
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-lg rounded-lg p-3 shadow-md relative text-sm leading-relaxed",
                    message.type === "user"
                      ? "bg-blue-600 text-white ml-8"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
                  )}
                >
                  <div className="mb-1">
                    {message.type === "bot" ? (
                      <div>
                        <div>{message.content.split(". References:")[0]}.</div>
                        {message.documentReferences &&
                          message.documentReferences.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                              <div className="text-xs font-semibold mb-1">
                                {t.references}:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {message.documentReferences.map(
                                  (source: ApiSourceDocumentData, index: number) => ( // Iterate over ApiSourceDocumentData
                                    <button
                                      key={index}
                                      onClick={() =>
                                        // onSelectDocumentReference expects a string, typically the filename
                                        onSelectDocumentReference?.(source.filename || "Unknown Document")
                                      }
                                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 font-medium text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                      title={source.preview || `Page: ${source.page || 'N/A'}`} // Show preview or page on hover
                                    >
                                      [{source.filename}{source.page ? ` (p. ${source.page})` : ''}]
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs opacity-70 mt-1">
                    <span>{formatTimestamp(message.timestamp)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                      onClick={() => deleteChatMessage(message.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {message.type === "user" && (
                  <Avatar className="flex-shrink-0 w-7 h-7">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      J
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div
          className={cn(
            "p-4 border-t bg-gray-50 dark:bg-gray-700 transition-all duration-200",
            dragState.chatDragOver &&
              "bg-blue-100 dark:bg-blue-900/30 border-blue-400 border-2",
          )}
          onDragOver={onDragHandlers.onDragOver}
          onDragLeave={onDragHandlers.onDragLeave}
          onDrop={onDragHandlers.onDrop}
        >
          <div className="flex space-x-3">
            <Textarea
              placeholder={t.askQuestion}
              value={chatState.currentMessage}
              onChange={(e) =>
                onChatAction((prev) => ({
                  ...prev,
                  currentMessage: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[50px] resize-none"
            />
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
                disabled={isBotReplying || !chatState.currentMessage.trim()}
              >
                {isBotReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>

              {/* Chat File Upload */}
              <input
                ref={chatFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFileUpload(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => chatFileInputRef.current?.click()}
                title={`${t.uploadFiles} ${t.myDocuments}`}
              >
                <Upload className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveConversation}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {dragState.chatDragOver && (
            <div className="text-center text-blue-600 dark:text-blue-400 text-sm mt-2 font-medium">
              <Upload className="h-5 w-5 mx-auto mb-1" />
              {t.dragDropHere} - {t.myDocuments}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;
