import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileJson, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { parseFile, type ImportResult } from "@/lib/importCredentials";
import type { CredentialInsert } from "@/hooks/useCredentials";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (cred: CredentialInsert) => Promise<void>;
}

export default function ImportDialog({ open, onClose, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (file: File) => {
    setFilename(file.name);
    const text = await file.text();
    const r = parseFile(file.name, text);
    setResult(r);
  };

  const handleConfirm = async () => {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < result.valid.length; i++) {
      try {
        await onImport(result.valid[i]);
        success++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / result.valid.length) * 100));
    }
    setImporting(false);
    toast.success(`Importação concluída: ${success} adicionadas${failed ? `, ${failed} falharam` : ""}`);
    handleClose();
  };

  const handleClose = () => {
    setResult(null);
    setFilename("");
    setProgress(0);
    setImporting(false);
    if (fileInput.current) fileInput.current.value = "";
    onClose();
  };

  const downloadTemplate = (kind: "csv" | "json") => {
    const sample = [{
      nick: "Exemplo Gmail",
      email: "voce@gmail.com",
      password: "SenhaForte123!",
      category: "E-mails",
      devices: "Desktop,Laptop",
      url: "https://gmail.com",
      description: "Conta principal",
      notes: "",
      expires_at: "",
      is_favorite: "false",
    }];
    let blob: Blob;
    let name: string;
    if (kind === "json") {
      blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      name = "vaultkey-template.json";
    } else {
      const headers = Object.keys(sample[0]);
      const rows = sample.map((r) => headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(","));
      blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
      name = "vaultkey-template.csv";
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Credenciais</DialogTitle>
          <DialogDescription>
            Envie um arquivo <strong>.csv</strong> ou <strong>.json</strong>. Campos obrigatórios: <code>nick</code> e <code>password</code>.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/40 transition"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clique ou arraste um arquivo</p>
              <p className="text-xs text-muted-foreground">CSV ou JSON</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Baixar modelo:</span>
              <Button size="sm" variant="outline" onClick={() => downloadTemplate("csv")}>
                <FileText className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadTemplate("json")}>
                <FileJson className="h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Arquivo: <span className="font-mono">{filename}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Válidas
                </div>
                <p className="text-2xl font-bold font-mono">{result.valid.length}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Erros
                </div>
                <p className="text-2xl font-bold font-mono">{result.errors.length}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-auto rounded-lg border border-border bg-muted/20 p-2 text-xs">
                {result.errors.slice(0, 20).map((e, i) => (
                  <div key={i} className="font-mono">Linha {e.row}: {e.reason}</div>
                ))}
                {result.errors.length > 20 && <div className="text-muted-foreground mt-1">+ {result.errors.length - 20} erros…</div>}
              </div>
            )}

            {importing && (
              <div className="text-xs text-muted-foreground">Importando… {progress}%</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={importing}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={importing || result.valid.length === 0}>
                Importar {result.valid.length}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
