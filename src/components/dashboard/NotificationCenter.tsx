import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import {
  Search,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Plus,
  Calendar,
} from "lucide-react";

interface NotificationProps {
  notifications?: {
    id: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: "sent" | "failed" | "pending";
    type: "confirmation" | "reminder";
    message: string;
    sentAt?: string;
  }[];
}

const NotificationCenter = ({
  notifications = [
    {
      id: "1",
      patientName: "Marco Rossi",
      appointmentDate: "2023-06-15",
      appointmentTime: "10:00",
      status: "sent",
      type: "confirmation",
      message:
        'Gentile Marco, confermiamo il suo appuntamento per il 15/06/2023 alle 10:00. Risponda "OK" per confermare.',
      sentAt: "2023-06-10 14:30",
    },
    {
      id: "2",
      patientName: "Giulia Bianchi",
      appointmentDate: "2023-06-16",
      appointmentTime: "11:30",
      status: "pending",
      type: "reminder",
      message:
        "Gentile Giulia, le ricordiamo il suo appuntamento per domani 16/06/2023 alle 11:30. A presto!",
    },
    {
      id: "3",
      patientName: "Luca Verdi",
      appointmentDate: "2023-06-14",
      appointmentTime: "15:45",
      status: "failed",
      type: "confirmation",
      message:
        'Gentile Luca, confermiamo il suo appuntamento per il 14/06/2023 alle 15:45. Risponda "OK" per confermare.',
      sentAt: "2023-06-09 09:15",
    },
    {
      id: "4",
      patientName: "Sofia Neri",
      appointmentDate: "2023-06-18",
      appointmentTime: "09:15",
      status: "sent",
      type: "reminder",
      message:
        "Gentile Sofia, le ricordiamo il suo appuntamento per domani 18/06/2023 alle 09:15. A presto!",
      sentAt: "2023-06-17 10:00",
    },
    {
      id: "5",
      patientName: "Alessandro Gialli",
      appointmentDate: "2023-06-20",
      appointmentTime: "16:30",
      status: "pending",
      type: "confirmation",
      message:
        'Gentile Alessandro, confermiamo il suo appuntamento per il 20/06/2023 alle 16:30. Risponda "OK" per confermare.',
    },
  ],
}: NotificationProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter notifications based on search query and filters
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    const matchesSearch =
      notification.patientName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || notification.status === statusFilter;

    // Type filter
    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter notifications by tab
  const getTabNotifications = (tab: string) => {
    if (tab === "all") return filteredNotifications;
    if (tab === "pending")
      return filteredNotifications.filter((n) => n.status === "pending");
    if (tab === "sent")
      return filteredNotifications.filter((n) => n.status === "sent");
    if (tab === "failed")
      return filteredNotifications.filter((n) => n.status === "failed");
    return filteredNotifications;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Inviato</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      case "pending":
        return <Badge variant="secondary">In attesa</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Centro Notifiche WhatsApp</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // Apri un modale o naviga a una pagina per creare una nuova notifica
              alert(
                "Questa funzionalità permetterebbe di creare una nuova notifica WhatsApp da inviare ai pazienti. Implementazione in corso.",
              );
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Invia Notifica
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Notifiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inviate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter((n) => n.status === "sent").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Attesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {notifications.filter((n) => n.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fallite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter((n) => n.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {notifications.filter((n) => n.status === "failed").length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>
            Ci sono {notifications.filter((n) => n.status === "failed").length}{" "}
            notifiche che non sono state inviate correttamente. Controlla la
            connessione WhatsApp e riprova.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca paziente o messaggio..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="sent">Inviati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="failed">Falliti</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="confirmation">Conferma</SelectItem>
                <SelectItem value="reminder">Promemoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            Tutte ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            In Attesa (
            {filteredNotifications.filter((n) => n.status === "pending").length}
            )
          </TabsTrigger>
          <TabsTrigger value="sent">
            Inviate (
            {filteredNotifications.filter((n) => n.status === "sent").length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Fallite (
            {filteredNotifications.filter((n) => n.status === "failed").length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "sent", "failed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {getTabNotifications(tab).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Send className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">
                  Nessuna notifica trovata
                </h3>
                <p className="text-muted-foreground mt-2 mb-4 max-w-md">
                  Non ci sono notifiche{" "}
                  {tab !== "all" ? `con stato "${tab}"` : ""} che corrispondono
                  ai criteri di ricerca.
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Nuova Notifica
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stato</TableHead>
                      <TableHead>Paziente</TableHead>
                      <TableHead>Appuntamento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Inviato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getTabNotifications(tab).map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(notification.status)}
                            {getStatusBadge(notification.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {notification.patientName}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            notification.appointmentDate,
                          ).toLocaleDateString("it-IT")}{" "}
                          {notification.appointmentTime}
                        </TableCell>
                        <TableCell>
                          {notification.type === "confirmation" ? (
                            <Badge variant="outline">Conferma</Badge>
                          ) : (
                            <Badge variant="outline">Promemoria</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {notification.sentAt ? (
                            new Date(notification.sentAt).toLocaleString(
                              "it-IT",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              alert(
                                `Invio notifica WhatsApp al paziente ${notification.patientName} per l'appuntamento del ${notification.appointmentDate}`,
                              );
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
