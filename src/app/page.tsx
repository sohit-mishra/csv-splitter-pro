"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";

import {
  Upload,
  Download,
  Scissors,
  Package,
  FileText,
  Database,
  Trash2,
} from "lucide-react";

type RowData = Record<string, any>;

export default function HomePage() {
  const [data, setData] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const [customerHeader, setCustomerHeader] =
    useState("");

  const [phoneHeader, setPhoneHeader] =
    useState("");

  const [splitSize, setSplitSize] = useState(10);

  // =========================================
  // Upload File
  // =========================================

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (evt) => {
      const binaryStr = evt.target?.result;

      if (!binaryStr) return;

      const workbook = XLSX.read(binaryStr, {
        type: "binary",
      });

      const sheetName =
        workbook.SheetNames[0];

      const worksheet =
        workbook.Sheets[sheetName];

      const jsonData =
        XLSX.utils.sheet_to_json<RowData>(
          worksheet
        );

      setData(jsonData);

      if (jsonData.length > 0) {
        setHeaders(
          Object.keys(jsonData[0])
        );
      }
    };

    reader.readAsBinaryString(file);
  };

  // =========================================
  // Remove Duplicate Phones
  // =========================================

  const getUniqueData = (
    rows: RowData[]
  ) => {
    const uniquePhones = new Set();

    return rows.filter((row) => {
      const phone = String(
        row[phoneHeader]
      ).trim();

      if (
        !phone ||
        uniquePhones.has(phone)
      ) {
        return false;
      }

      uniquePhones.add(phone);

      return true;
    });
  };

  // =========================================
  // Split ZIP Download
  // =========================================

  const handleSplitDownload =
    async () => {
      if (
        !customerHeader ||
        !phoneHeader
      ) {
        alert("Select headers first");
        return;
      }

      const uniqueData =
        getUniqueData(data);

      const zip = new JSZip();

      for (
        let i = 0;
        i < uniqueData.length;
        i += splitSize
      ) {
        const chunk = uniqueData.slice(
          i,
          i + splitSize
        );

        const exportData = chunk.map(
          (row) => ({
            customer_name:
              row[customerHeader],

            phone: row[phoneHeader],
          })
        );

        const ws =
          XLSX.utils.json_to_sheet(
            exportData
          );

        const csv =
          XLSX.utils.sheet_to_csv(ws);

        zip.file(
          `split_${
            i / splitSize + 1
          }.csv`,
          csv
        );
      }

      const content =
        await zip.generateAsync({
          type: "blob",
        });

      saveAs(content, "split_files.zip");
    };

  // =========================================
  // Full CSV Download
  // =========================================

  const handleWithoutSplit = () => {
    if (
      !customerHeader ||
      !phoneHeader
    ) {
      alert("Select headers first");
      return;
    }

    const uniqueData =
      getUniqueData(data);

    const exportData = uniqueData.map(
      (row) => ({
        customer_name:
          row[customerHeader],

        phone: row[phoneHeader],
      })
    );

    const ws =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const csv =
      XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "customers.csv");
  };

  // =========================================
  // Combined ZIP Download
  // =========================================

  const handleCombinedZip =
    async () => {
      if (
        !customerHeader ||
        !phoneHeader
      ) {
        alert("Select headers first");
        return;
      }

      const uniqueData =
        getUniqueData(data);

      const zip = new JSZip();

      // Split Folder

      const splitFolder =
        zip.folder("split_files");

      for (
        let i = 0;
        i < uniqueData.length;
        i += splitSize
      ) {
        const chunk = uniqueData.slice(
          i,
          i + splitSize
        );

        const exportData = chunk.map(
          (row) => ({
            customer_name:
              row[customerHeader],

            phone: row[phoneHeader],
          })
        );

        const ws =
          XLSX.utils.json_to_sheet(
            exportData
          );

        const csv =
          XLSX.utils.sheet_to_csv(ws);

        splitFolder?.file(
          `split_${
            i / splitSize + 1
          }.csv`,
          csv
        );
      }

      // Full CSV Folder

      const fullFolder =
        zip.folder("full_csv");

      const allData = uniqueData.map(
        (row) => ({
          customer_name:
            row[customerHeader],

          phone: row[phoneHeader],
        })
      );

      const wsAll =
        XLSX.utils.json_to_sheet(
          allData
        );

      const csvAll =
        XLSX.utils.sheet_to_csv(wsAll);

      fullFolder?.file(
        "customers.csv",
        csvAll
      );

      // Download ZIP

      const content =
        await zip.generateAsync({
          type: "blob",
        });

      saveAs(
        content,
        "combined_download.zip"
      );
    };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2563eb33,transparent_30%),radial-gradient(circle_at_bottom_left,#9333ea33,transparent_30%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: -40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/10 px-6 py-3 rounded-full backdrop-blur-xl mb-6">
            <Database className="text-cyan-400" />

            <span className="text-sm tracking-widest">
              CSV SPLITTER PRO
            </span>
          </div>

          <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-5">
            Upload & Split CSV
          </h1>

          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Upload Excel or CSV files,
            remove duplicate phone
            numbers and download ZIP
            exports beautifully.
          </p>
        </motion.div>

        {/* Upload */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="bg-white/5 border border-white/10 rounded-[35px] p-10 backdrop-blur-2xl mb-10"
        >
          <label className="border-2 border-dashed border-zinc-700 hover:border-cyan-400 transition-all duration-300 rounded-[30px] p-16 flex flex-col items-center justify-center cursor-pointer">
            <Upload
              size={70}
              className="text-cyan-400"
            />

            <h2 className="text-4xl font-bold mt-6">
              Upload File
            </h2>

            <p className="text-zinc-400 mt-4 text-lg">
              CSV • XLS • XLSX Supported
            </p>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={
                handleFileUpload
              }
              className="hidden"
            />
          </label>

          {fileName && (
            <div className="mt-8 bg-black/40 border border-cyan-500/20 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">
                  Uploaded File
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  {fileName}
                </h3>
              </div>

              <div className="bg-cyan-500/20 text-cyan-400 px-5 py-3 rounded-2xl text-lg font-semibold">
                {data.length} Rows
              </div>
            </div>
          )}
        </motion.div>

        {/* Header Selection */}
        {headers.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Customer Header */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-8">
              <h2 className="text-3xl font-bold mb-4">
                Customer Name Header
              </h2>

              <select
                value={customerHeader}
                onChange={(e) =>
                  setCustomerHeader(
                    e.target.value
                  )
                }
                className="w-full bg-black/40 border border-zinc-700 rounded-2xl p-5 text-lg"
              >
                <option value="">
                  Select Header
                </option>

                {headers.map((header) => (
                  <option
                    key={header}
                    value={header}
                  >
                    {header}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Header */}
            <div className="bg-white/5 border border-white/10 rounded-[30px] p-8">
              <h2 className="text-3xl font-bold mb-4">
                Phone Header
              </h2>

              <select
                value={phoneHeader}
                onChange={(e) =>
                  setPhoneHeader(
                    e.target.value
                  )
                }
                className="w-full bg-black/40 border border-zinc-700 rounded-2xl p-5 text-lg"
              >
                <option value="">
                  Select Header
                </option>

                {headers.map((header) => (
                  <option
                    key={header}
                    value={header}
                  >
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Action Cards */}
        {data.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Split ZIP */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-[35px] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-cyan-500/20 p-4 rounded-2xl">
                  <Scissors className="text-cyan-400" />
                </div>

                <h2 className="text-3xl font-bold">
                  Split ZIP
                </h2>
              </div>

              <p className="text-zinc-400 mb-5">
                Split CSV files into ZIP.
              </p>

              <input
                type="number"
                value={splitSize}
                onChange={(e) =>
                  setSplitSize(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full bg-black/40 border border-zinc-700 rounded-2xl p-5 mb-6 text-lg"
              />

              <button
                onClick={
                  handleSplitDownload
                }
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-5 rounded-2xl"
              >
                <div className="flex items-center justify-center gap-3 text-lg">
                  <Download />
                  Download ZIP
                </div>
              </button>
            </div>

            {/* Full CSV */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-[35px] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-emerald-500/20 p-4 rounded-2xl">
                  <FileText className="text-emerald-400" />
                </div>

                <h2 className="text-3xl font-bold">
                  Full CSV
                </h2>
              </div>

              <p className="text-zinc-400 mb-14">
                Download full CSV
                without duplicate phones.
              </p>

              <button
                onClick={
                  handleWithoutSplit
                }
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-black font-bold py-5 rounded-2xl"
              >
                <div className="flex items-center justify-center gap-3 text-lg">
                  <Download />
                  Download CSV
                </div>
              </button>
            </div>

            {/* Combined ZIP */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-[35px] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-purple-500/20 p-4 rounded-2xl">
                  <Package className="text-purple-400" />
                </div>

                <h2 className="text-3xl font-bold">
                  Combined ZIP
                </h2>
              </div>

              <p className="text-zinc-400 mb-14">
                Download split files +
                full CSV together.
              </p>

                   <input
                type="number"
                value={splitSize}
                onChange={(e) =>
                  setSplitSize(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full bg-black/40 border border-zinc-700 rounded-2xl p-5 mb-6 text-lg"
              />
              <button
                onClick={
                  handleCombinedZip
                }
                className="w-full bg-purple-400 hover:bg-purple-300 text-black font-bold py-5 rounded-2xl"
              >
                <div className="flex items-center justify-center gap-3 text-lg">
                  <Download />
                  Download Combined ZIP
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Remove Info */}
        {phoneHeader && (
          <div className="mt-10 bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-center gap-4">
            <div className="bg-red-500/20 p-4 rounded-2xl">
              <Trash2 className="text-red-400" />
            </div>

            <div>
              <h3 className="text-2xl font-bold">
                Duplicate Phone Remove
                Enabled
              </h3>

              <p className="text-zinc-400 mt-2">
                Same phone numbers are
                automatically removed
                before download.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}