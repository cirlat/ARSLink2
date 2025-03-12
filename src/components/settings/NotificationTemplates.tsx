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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  type: string;
  createdAt: string;
}

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    type: "custom",
  });

  // Carica i template dal database all'avvio
  useEffect(() => {
    const loadTemplatesFromDatabase = async () => {
      try {
        // Carica i template dal database
        const { default: Database } = await import("@/models/database");
        const db = Database.getInstance();

        const result = await db.query(
          "SELECT value FROM configurations WHERE key = 'whatsapp_templates'",
        );

        if (result.length > 0) {
          const templatesData = JSON.parse(result[0].value);
          setTemplates(templatesData);
        } else {
          // Template predefiniti
          const defaultTemplates = [
            {
              id: "1",
              name: "Conferma Appuntamento",
              content:
                "Gentile {paziente}, confermiamo il suo appuntamento per il {data} alle {ora}. Risponda 'OK' per confermare.",
              type: "appointment",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Promemoria Appuntamento",
              content:
                "Gentile {paziente}, le ricordiamo il suo appuntamento per domani {data} alle {ora}. A presto!",
              type: "reminder",
              createdAt: new Date().toISOString(),
            },
          ];

          setTemplates(defaultTemplates);

          // Salva i template predefiniti nel database
          try {
            await db.query(
              "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
              ["whatsapp_templates", JSON.stringify(defaultTemplates)],
            );
          } catch (dbError) {
            console.error(
              "Errore nel salvataggio dei template predefiniti nel database:",
              dbError,
            );
          }
        }
      } catch (error) {
        console.error(
          "Errore nel caricamento dei template dal database:",
          error,
        );

        // Fallback a localStorage
        const savedTemplates = localStorage.getItem("whatsappTemplates");
        if (savedTemplates) {
          try {
            setTemplates(JSON.parse(savedTemplates));
          } catch (parseError) {
            console.error("Errore nel parsing dei template:", parseError);
          }
        } else {
          // Template predefiniti
          const defaultTemplates = [
            {
              id: "1",
              name: "Conferma Appuntamento",
              content:
                "Gentile {paziente}, confermiamo il suo appuntamento per il {data} alle {ora}. Risponda 'OK' per confermare.",
              type: "appointment",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Promemoria Appuntamento",
              content:
                "Gentile {paziente}, le ricordiamo il suo appuntamento per domani {data} alle {ora}. A presto!",
              type: "reminder",
              createdAt: new Date().toISOString(),
            },
          ];
          setTemplates(defaultTemplates);
          localStorage.setItem(
            "whatsappTemplates",
            JSON.stringify(defaultTemplates),
          );
        }
      }
    };

    loadTemplatesFromDatabase();
  }, []);

  // Salva i template nel database quando cambiano
  useEffect(() => {
    if (templates.length > 0) {
      const saveTemplatesToDatabase = async () => {
        try {
          const { default: Database } = await import("@/models/database");
          const db = Database.getInstance();

          await db.query(
            "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
            ["whatsapp_templates", JSON.stringify(templates)],
          );

          console.log("Template salvati nel database");
        } catch (error) {
          console.error(
            "Errore nel salvataggio dei template nel database:",
            error,
          );

          // Fallback a localStorage
          localStorage.setItem("whatsappTemplates", JSON.stringify(templates));
        }
      };

      saveTemplatesToDatabase();
    }
  }, [templates]);

  // Gestione dell'aggiunta di un nuovo template
  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      alert("Nome e contenuto sono obbligatori");
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content,
      type: newTemplate.type,
      createdAt: new Date().toISOString(),
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: "", content: "", type: "custom" });
    setIsDialogOpen(false);
  };

  // Gestione della modifica di un template
  const handleEditTemplate = () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.content) {
      alert("Nome e contenuto sono obbligatori");
      return;
    }

    const updatedTemplates = templates.map((template) =>
      template.id === editingTemplate.id ? editingTemplate : template,
    );

    setTemplates(updatedTemplates);
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  // Gestione dell'eliminazione di un template
  const handleDeleteTemplate = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo template?")) {
      const updatedTemplates = templates.filter(
        (template) => template.id !== id,
      );
      setTemplates(updatedTemplates);
    }
  };

  // Apertura del dialog per la modifica
  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  // Apertura del dialog per l'aggiunta
  const openAddDialog = () => {
    setEditingTemplate(null);
    setNewTemplate({ name: "", content: "", type: "custom" });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Notifiche WhatsApp</CardTitle>
        <CardDescription>
          Gestisci i template per le notifiche WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Template
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Contenuto</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  {template.type === "appointment"
                    ? "Appuntamento"
                    : template.type === "reminder"
                      ? "Promemoria"
                      : "Personalizzato"}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {template.content}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  Nessun template trovato. Aggiungi il tuo primo template.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Modifica Template" : "Nuovo Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? "Modifica il template esistente"
                  : "Crea un nuovo template per le notifiche WhatsApp"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome Template</Label>
                <Input
                  id="template-name"
                  placeholder="Es. Conferma Appuntamento"
                  value={
                    editingTemplate ? editingTemplate.name : newTemplate.name
                  }
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value,
                        })
                      : setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Tipo Template</Label>
                <Select
                  value={
                    editingTemplate ? editingTemplate.type : newTemplate.type
                  }
                  onValueChange={(value) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          type: value,
                        })
                      : setNewTemplate({ ...newTemplate, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Appuntamento</SelectItem>
                    <SelectItem value="reminder">Promemoria</SelectItem>
                    <SelectItem value="custom">Personalizzato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-content">Contenuto</Label>
                <Textarea
                  id="template-content"
                  placeholder="Gentile {paziente}, ..."
                  className="min-h-[120px]"
                  value={
                    editingTemplate
                      ? editingTemplate.content
                      : newTemplate.content
                  }
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          content: e.target.value,
                        })
                      : setNewTemplate({
                          ...newTemplate,
                          content: e.target.value,
                        })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Usa {"{paziente}"}, {"{data}"}, {"{ora}"} come segnaposto per
                  i dati dinamici.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
              <Button
                onClick={
                  editingTemplate ? handleEditTemplate : handleAddTemplate
                }
              >
                {editingTemplate ? "Salva Modifiche" : "Crea Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default NotificationTemplates;
