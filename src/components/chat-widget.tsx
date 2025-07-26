
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Users, ChevronUp, ChevronDown, UserCheck, Circle } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface ChatWidgetProps {
  companyId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'manager';
  departmentName?: string;
}

interface OpenChat {
    id: string; // The other user's ID
    name: string;
    avatar: string;
}

function ChatWindow({ chatPartner, onClose }: { chatPartner: OpenChat, onClose: () => void }) {
    const [message, setMessage] = useState('');
    const { userId, sendMessage, chatMessages } = useEmployees();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const conversationId = [userId, chatPartner.id].sort().join('_');
    const messages = chatMessages[conversationId] || [];

     useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if(scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '' || !userId) return;
        await sendMessage(message, chatPartner.id);
        setMessage('');
    };

    return (
        <Card className="w-80 h-96 flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b cursor-pointer" onClick={onClose}>
                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={chatPartner.avatar} />
                        <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">{chatPartner.name}</CardTitle>
                </div>
                 <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); onClose();}}><X className="h-4 w-4"/></Button>
            </CardHeader>
             <ScrollArea className="flex-1 p-2" ref={scrollAreaRef}>
                <div className="space-y-4 p-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-3 py-2 ${
                          msg.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {format(new Date(msg.timestamp), 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <CardFooter className="p-2 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message..."
                    autoComplete="off"
                    disabled={!userId}
                  />
                  <Button type="submit" size="icon" disabled={!userId || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
        </Card>
    )
}


export function ChatWidget({ companyId, userId, userName, userRole, departmentName }: ChatWidgetProps) {
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const { onlineUsers, employees, departments, admins } = useEmployees();
  
  const managers = departments
    .map(dept => employees.find(emp => emp.id === dept.managerId))
    .filter((emp): emp is NonNullable<typeof emp> => emp != null);

  const isAdmin = userRole === 'admin';
  const contacts = isAdmin ? managers : admins;
  
  const toggleChat = (contact: any) => {
    const contactId = contact.id;
    const contactName = isAdmin ? `${contact.firstName} ${contact.lastName}` : contact.name;
    const contactAvatar = isAdmin ? contact.photoUrl : undefined;

    setOpenChats(prev => {
        const isAlreadyOpen = prev.some(c => c.id === contactId);
        if (isAlreadyOpen) {
            return prev.filter(c => c.id !== contactId);
        } else {
            // Limit to 3 open chats
            const newChats = [...prev, { id: contactId, name: contactName, avatar: contactAvatar }];
            return newChats.slice(-3);
        }
    })
  }
  
  const closeChat = (contactId: string) => {
    setOpenChats(prev => prev.filter(c => c.id !== contactId));
  }
  
  return (
    <>
      <div className="fixed bottom-0 right-4 z-50 flex items-end gap-4">
        {openChats.map(chat => (
            <ChatWindow key={chat.id} chatPartner={chat} onClose={() => closeChat(chat.id)} />
        ))}
        <Card className="w-72 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-3 border-b cursor-pointer" onClick={() => setIsContactListOpen(!isContactListOpen)}>
                <div className="flex items-center gap-2">
                     <Users className="h-5 w-5"/>
                     <CardTitle className="text-base">Contacts</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{onlineUsers.length} en ligne</Badge>
                    <Button variant="ghost" size="icon">
                        {isContactListOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {isContactListOpen && (
                <ScrollArea className="h-80">
                    <CardContent className="p-2">
                        <ul>
                            {contacts.map(contact => {
                                const contactId = contact.id;
                                const contactName = isAdmin ? `${contact.firstName} ${contact.lastName}` : contact.name;
                                const contactAvatar = isAdmin ? contact.photoUrl : `https://placehold.co/40x40.png?text=${contactName.charAt(0)}`;
                                const contactRole = isAdmin ? contact.domain : contact.role;
                                const isOnline = onlineUsers.some(u => u.userId === contactId);

                                return (
                                     <li key={contactId}>
                                         <button className="w-full text-left p-2 rounded-md hover:bg-secondary flex items-center gap-3" onClick={() => toggleChat(contact)}>
                                            <Avatar className="w-9 h-9">
                                                <AvatarImage src={contactAvatar} />
                                                <AvatarFallback>{contactName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{contactName}</p>
                                                <p className="text-xs text-muted-foreground">{contactRole}</p>
                                            </div>
                                            {isOnline ? <Circle className="h-2.5 w-2.5 text-green-400 fill-current" /> : <Circle className="h-2.5 w-2.5 text-muted-foreground/30 fill-current" />}
                                         </button>
                                     </li>
                                )
                            })}
                        </ul>
                    </CardContent>
                </ScrollArea>
            )}
        </Card>
      </div>
    </>
  );
}
