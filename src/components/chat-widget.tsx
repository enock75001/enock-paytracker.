
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Users, UserCheck, Circle } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from './ui/separator';

interface ChatWidgetProps {
  companyId: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'manager';
  departmentName?: string;
}

export function ChatWidget({ companyId, userId, userName, userRole, departmentName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { onlineUsers, chatMessages, sendMessage, employees, departments } = useEmployees();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    await sendMessage({
      companyId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      text: message,
    });
    setMessage('');
  };
  
  const managers = departments
    .map(dept => employees.find(emp => emp.id === dept.managerId))
    .filter((emp): emp is NonNullable<typeof emp> => emp != null);

  const isAdmin = userRole === 'admin';

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-16 h-16 shadow-lg">
          {isOpen ? <X /> : <MessageSquare />}
        </Button>
      </div>

      {isOpen && (
        <Card className="fixed bottom-24 right-4 z-50 w-96 h-[600px] flex flex-col shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5"/>
                Discussion
            </CardTitle>
            <Badge variant="secondary">{onlineUsers.length} en ligne</Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex">
            <ScrollArea className="w-1/3 border-r p-2">
                <h3 className="text-sm font-semibold mb-2 px-2">En Ligne</h3>
                <ul>
                    {onlineUsers.map(user => (
                        <li key={user.userId} className="text-xs p-2 rounded-md hover:bg-secondary flex items-center gap-2">
                            <UserCheck className="h-3 w-3 text-green-400"/>
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-muted-foreground">{user.departmentName || user.role}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                
                {isAdmin && managers.length > 0 && (
                    <>
                        <Separator className="my-2" />
                        <h3 className="text-sm font-semibold mb-2 px-2">Tous les Managers</h3>
                         <ul>
                            {managers.map(manager => {
                                const isOnline = onlineUsers.some(u => u.userId === manager.id);
                                return (
                                    <li key={manager.id} className="text-xs p-2 rounded-md hover:bg-secondary flex items-center gap-2">
                                        {isOnline ? <UserCheck className="h-3 w-3 text-green-400"/> : <Circle className="h-2 w-2 text-muted-foreground" />}
                                        <div>
                                            <p className="font-medium">{manager.firstName} {manager.lastName}</p>
                                            <p className="text-muted-foreground">{manager.domain}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}

            </ScrollArea>
            <div className="w-2/3 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
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
                        {msg.senderName} - {format(new Date(msg.timestamp), 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <CardFooter className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message..."
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
