import { FileJson, Upload } from "lucide-react";

type FileDropProps = {
  label: string;
  accept: string;
  fileName?: string;
  onFile: (file: File) => void;
};

export function FileDrop({ label, accept, fileName, onFile }: FileDropProps) {
  return (
    <label className="fileDrop">
      <input
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
        }}
      />
      <span className="fileIcon" aria-hidden="true">
        {fileName ? <FileJson size={18} /> : <Upload size={18} />}
      </span>
      <span>
        <strong>{label}</strong>
        <small>{fileName ?? "Choose file"}</small>
      </span>
    </label>
  );
}
