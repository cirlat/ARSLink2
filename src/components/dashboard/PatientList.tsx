import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  FileEdit,
  Trash2,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface Patient {
  id: string;
  name: string;
  codiceFiscale: string;
  phone: string;
  email: string;
  lastAppointment: string;
  nextAppointment: string | null;
}

interface PatientListProps {
  patients?: Patient[];
  onAddPatient?: () => void;
  onEditPatient?: (id: string) => void;
  onDeletePatient?: (id: string) => void;
  onViewPatient?: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({
  patients: propPatients,

  onAddPatient,
  onEditPatient = (id) => console.log("Edit patient", id),
  onDeletePatient = (id) => console.log("Delete patient", id),
  onViewPatient = (id) => console.log("View patient", id),
}) => {
  const navigate = useNavigate();

  // Carica i pazienti da localStorage
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    try {
      const storedPatients = JSON.parse(
        localStorage.getItem("patients") || "[]",
      );
      if (storedPatients.length > 0) {
        // Converti i dati dal formato di storage al formato richiesto dal componente
        const formattedPatients = storedPatients.map((p: any) => ({
          id: p.id || String(Date.now()),
          name: `${p.firstName} ${p.lastName}`,
          codiceFiscale: p.fiscalCode || "",
          phone: p.phone || "",
          email: p.email || "",
          lastAppointment: "N/A", // In un'implementazione reale, questo verrebbe calcolato dagli appuntamenti
          nextAppointment: null, // In un'implementazione reale, questo verrebbe calcolato dagli appuntamenti
        }));
        setPatients(formattedPatients);
      } else if (propPatients) {
        setPatients(propPatients);
      } else {
        // Dati di esempio se non ci sono pazienti
        setPatients([
          {
            id: "1",
            name: "Marco Rossi",
            codiceFiscale: "RSSMRC80A01H501U",
            phone: "+39 333 1234567",
            email: "marco.rossi@example.com",
            lastAppointment: "10/05/2023",
            nextAppointment: "15/06/2023",
          },
          {
            id: "2",
            name: "Giulia Bianchi",
            codiceFiscale: "BNCGLI85B42H501V",
            phone: "+39 333 7654321",
            email: "giulia.bianchi@example.com",
            lastAppointment: "22/04/2023",
            nextAppointment: null,
          },
        ]);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei pazienti:", error);
      // Usa dati di fallback
      setPatients([
        {
          id: "1",
          name: "Marco Rossi",
          codiceFiscale: "RSSMRC80A01H501U",
          phone: "+39 333 1234567",
          email: "marco.rossi@example.com",
          lastAppointment: "10/05/2023",
          nextAppointment: "15/06/2023",
        },
      ]);
    }
  }, [propPatients]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  // Gestione dell'aggiunta di un nuovo paziente
  const handleAddPatient = () => {
    if (onAddPatient) {
      onAddPatient();
    } else {
      navigate("/patients/new");
    }
  };

  // Gestione della visualizzazione dei dettagli di un paziente
  const handleViewPatient = (id: string) => {
    if (onViewPatient) {
      onViewPatient(id);
    } else {
      console.log(`Visualizzazione dettagli paziente ${id}`);
      // Salva l'ID del paziente selezionato in localStorage
      localStorage.setItem("selectedPatientId", id);
      navigate(`/patients/${id}`);
    }
  };

  // Gestione della modifica di un paziente
  const handleEditPatient = (id: string) => {
    if (onEditPatient) {
      onEditPatient(id);
    } else {
      console.log(`Modifica paziente ${id}`);
      // Salva l'ID del paziente selezionato in localStorage
      localStorage.setItem("selectedPatientId", id);
      localStorage.setItem("editMode", "true");
      navigate(`/patients/${id}/edit`);
    }
  };

  // Gestione dell'eliminazione di un paziente
  const handleDeleteConfirm = async (id: string) => {
    try {
      // Elimina il paziente da localStorage
      const storedPatients = JSON.parse(
        localStorage.getItem("patients") || "[]",
      );
      const updatedPatients = storedPatients.filter(
        (patient: any) => patient.id !== id,
      );
      localStorage.setItem("patients", JSON.stringify(updatedPatients));

      // Aggiorna lo stato o ricarica i dati
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);

      // Mostra un messaggio di conferma
      alert("Paziente eliminato con successo");

      // Ricarica la pagina per mostrare i dati aggiornati
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Errore durante l'eliminazione del paziente:", error);
      alert(
        `Errore durante l'eliminazione del paziente: ${error.message || "Errore sconosciuto"}`,
      );
      setDeleteConfirmOpen(false);
      setPatientToDelete(null);
    }
  };

  // Filtra i pazienti in base al termine di ricerca
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.codiceFiscale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm),
  );

  // Calcola la paginazione
  const indexOfLastItem = currentPage * parseInt(itemsPerPage);
  const indexOfFirstItem = indexOfLastItem - parseInt(itemsPerPage);
  const currentPatients = filteredPatients.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(
    filteredPatients.length / parseInt(itemsPerPage),
  );

  // Gestione della conferma di eliminazione
  const handleDeleteClick = (id: string) => {
    setPatientToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (patientToDelete) {
      if (onDeletePatient) {
        onDeletePatient(patientToDelete);
      } else {
        handleDeleteConfirm(patientToDelete);
      }
    }
  };

  return (
    <div className="w-full h-full p-6 bg-white">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pazienti</h1>
          <Button
            onClick={handleAddPatient}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Paziente
          </Button>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, codice fiscale, email o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostra:</span>
            <Select
              value={itemsPerPage}
              onValueChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Codice Fiscale</TableHead>
                <TableHead>Contatto</TableHead>
                <TableHead>Ultimo Appuntamento</TableHead>
                <TableHead>Prossimo Appuntamento</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPatients.length > 0 ? (
                currentPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.name}
                    </TableCell>
                    <TableCell>{patient.codiceFiscale}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{patient.phone}</span>
                        <span className="text-sm text-muted-foreground">
                          {patient.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.lastAppointment}</TableCell>
                    <TableCell>
                      {patient.nextAppointment ? (
                        patient.nextAppointment
                      ) : (
                        <span className="text-muted-foreground">
                          Non programmato
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Apri menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewPatient(patient.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza Dettagli
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditPatient(patient.id)}
                          >
                            <FileEdit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(patient.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Nessun paziente trovato. Prova a modificare la ricerca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPatients.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Visualizzazione {indexOfFirstItem + 1} a{" "}
              {Math.min(indexOfLastItem, filteredPatients.length)} di{" "}
              {filteredPatients.length} pazienti
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Mostra la prima pagina, l'ultima pagina e le pagine intorno alla pagina corrente
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    // Mostra i puntini di sospensione per i gap
                    if (page === 2 && currentPage > 3) {
                      return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (
                      page === totalPages - 1 &&
                      currentPage < totalPages - 2
                    ) {
                      return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return null;
                  },
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Dialog di conferma eliminazione */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo paziente? Questa azione non
              può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Elimina
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientList;
