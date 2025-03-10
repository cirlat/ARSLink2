import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Plus,
  MessageSquare,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  id: string;
  patientName: string;
  patientPhone: string;
  message: string;
  status: "pending" | "sent" | "failed";
  scheduledTime: string;
  sentTime?: string;
  type: "appointment_reminder" | "appointment_confirmation" | "custom";
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showNewNotificationDialog, setShowNewNotificationDialog] =
    useState(false);
  const [newNotification, setNewNotification] = useState({
    patientId: "",
    message: "",
    type: "custom" as
      | "appointment_reminder"
      | "appointment_confirmation"
      | "custom",
    scheduledTime: "",
  });

  // Carica le notifiche e i pazienti all'avvio
  useEffect(() => {
    // Carica le notifiche dal localStorage
    const savedNotifications = localStorage.getItem("notifications");
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      // Notifiche di esempio se non ce ne sono di salvate
      const defaultNotifications: Notification[] = [
        {
          id: "1",
          patientName: "Marco Rossi",
          patientPhone: "+39 333 1234567",
          message:
            "Gentile paziente, le ricordiamo l'appuntamento di domani alle 15:00. Conferma con OK.",
          status: "pending",
          scheduledTime: "2023-06-15 08:00",
          type: "appointment_reminder",
        },
        {
          id: "2",
          patientName: "Giulia Bianchi",
          patientPhone: "+39 333 7654321",
          message:
            "Gentile paziente, confermiamo l'appuntamento per il 20/06/2023 alle 10:30.",
          status: "sent",
          scheduledTime: "2023-06-10 09:00",
          sentTime: "2023-06-10 09:01",
          type: "appointment_confirmation",
        },
        {
          id: "3",
          patientName: "Luca Verdi",
          patientPhone: "+39 333 9876543",
          message:
            "Gentile paziente, le ricordiamo di portare i risultati degli esami all'appuntamento.",
          status: "failed",
          scheduledTime: "2023-06-12 10:00",
          type: "custom",
        },
      ];
      setNotifications(defaultNotifications);
      localStorage.setItem(
        "notifications",
        JSON.stringify(defaultNotifications),
      );
    }

    // Carica i pazienti dal localStorage o usa quelli di esempio
    const mockPatients: Patient[] = [
      { id: "1", name: "Marco Rossi", phone: "+39 333 1234567" },
      { id: "2", name: "Giulia Bianchi", phone: "+39 333 7654321" },
      { id: "3", name: "Luca Verdi", phone: "+39 333 9876543" },
      { id: "4", name: "Sofia Esposito", phone: "+39 333 5432167" },
      { id: "5", name: "Alessandro Romano", phone: "+39 333 6789012" },
    ];
    setPatients(mockPatients);
  }, []);

  const handleSendNotification = (notificationId: string) => {
    // Trova la notifica da inviare
    const notificationToSend = notifications.find(
      (n) => n.id === notificationId,
    );
    if (!notificationToSend) return;

    // Simula l'invio della notifica
    const success = Math.random() > 0.2; // 80% di probabilità di successo

    // Aggiorna lo stato della notifica
    const updatedNotifications = notifications.map((notification) => {
      if (notification.id === notificationId) {
        return {
          ...notification,
          status: success ? "sent" : "failed",
          sentTime: success ? new Date().toLocaleString() : undefined,
        };
      }
      return notification;
    });

    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

    // Mostra un messaggio di conferma
    if (success) {
      alert(
        `Notifica inviata con successo a ${notificationToSend.patientName}`,
      );
    } else {
      alert(
        `Errore nell'invio della notifica a ${notificationToSend.patientName}. Riprova più tardi.`,
      );
    }
  };

  const handleCreateNotification = () => {
    setShowNewNotificationDialog(true);
  };

  const handleSaveNewNotification = () => {
    // Verifica che tutti i campi siano compilati
    if (!newNotification.patientId || !newNotification.message) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    // Trova il paziente selezionato
    const selectedPatient = patients.find(
      (p) => p.id === newNotification.patientId,
    );
    if (!selectedPatient) {
      alert("Seleziona un paziente valido");
      return;
    }

    // Crea la nuova notifica
    const now = new Date();
    const newNotificationObj: Notification = {
      id: Date.now().toString(),
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      message: newNotification.message,
      status: "pending",
      scheduledTime: newNotification.scheduledTime || now.toLocaleString(),
      type: newNotification.type,
    };

    // Aggiorna lo stato delle notifiche
    const updatedNotifications = [...notifications, newNotificationObj];
    setNotifications(updatedNotifications);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));

    // Chiudi il dialog e resetta il form
    setShowNewNotificationDialog(false);
    setNewNotification({
      patientId: "",
      message: "",
      type: "custom",
      scheduledTime: "",
    });

    // Mostra un messaggio di conferma
    alert("Notifica creata con successo!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" /> In attesa
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Inviata
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" /> Fallita
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" /> Sconosciuto
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment_reminder":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "appointment_confirmation":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "custom":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    return notification.status === activeTab;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Centro Notifiche</h1>
        <Button onClick={handleCreateNotification}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Notifica
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifiche WhatsApp
          </CardTitle>
          <CardDescription>
            Gestisci le notifiche e i promemoria per i pazienti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">In Attesa</TabsTrigger>
              <TabsTrigger value="sent">Inviate</TabsTrigger>
              <TabsTrigger value="failed">Fallite</TabsTrigger>
              <TabsTrigger value="all">Tutte</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Tipo</TableHead>
                      <TableHead>Paziente</TableHead>
                      <TableHead>Messaggio</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Programmata</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            {getTypeIcon(notification.type)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {notification.patientName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {notification.patientPhone}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate">
                              {notification.message}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(notification.status)}
                          </TableCell>
                          <TableCell>
                            <div>{notification.scheduledTime}</div>
                            {notification.sentTime && (
                              <div className="text-xs text-muted-foreground">
                                Inviata: {notification.sentTime}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {notification.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSendNotification(notification.id)
                                }
                              >
                                <Send className="h-4 w-4 mr-1" /> Invia
                              </Button>
                            )}
                            {notification.status === "failed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleSendNotification(notification.id)
                                }
                              >
                                <Send className="h-4 w-4 mr-1" /> Riprova
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Nessuna notifica {activeTab !== "all" && activeTab}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Totale notifiche: {notifications.length}
          </div>
          <div className="text-sm">
            <span className="text-yellow-600 mr-2">
              In attesa:{" "}
              {notifications.filter((n) => n.status === "pending").length}
            </span>
            <span className="text-green-600 mr-2">
              Inviate: {notifications.filter((n) => n.status === "sent").length}
            </span>
            <span className="text-red-600">
              Fallite:{" "}
              {notifications.filter((n) => n.status === "failed").length}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Dialog per creare una nuova notifica */}
      <Dialog
        open={showNewNotificationDialog}
        onOpenChange={setShowNewNotificationDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crea Nuova Notifica</DialogTitle>
            <DialogDescription>
              Compila il form per creare una nuova notifica WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patient">Paziente</Label>
              <Select
                value={newNotification.patientId}
                onValueChange={(value) =>
                  setNewNotification({ ...newNotification, patientId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona un paziente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} ({patient.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo di Notifica</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value: any) =>
                  setNewNotification({ ...newNotification, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_reminder">
                    Promemoria Appuntamento
                  </SelectItem>
                  <SelectItem value="appointment_confirmation">
                    Conferma Appuntamento
                  </SelectItem>
                  <SelectItem value="custom">
                    Messaggio Personalizzato
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Messaggio</Label>
              <Textarea
                id="message"
                placeholder="Inserisci il messaggio da inviare"
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    message: e.target.value,
                  })
                }
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="scheduledTime">
                Data e Ora Programmata (opzionale)
              </Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={newNotification.scheduledTime}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    scheduledTime: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewNotificationDialog(false)}
            >
              Annulla
            </Button>
            <Button onClick={handleSaveNewNotification}>Salva Notifica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;
