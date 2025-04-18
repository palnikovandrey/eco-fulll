'use client';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default function Home() {
  const [view, setView] = useState("main");
  const [projects, setProjects] = useState([]);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    region: "",
    district: "",
    city: "",
    street: "",
    customer: "",
    contractor: ""
  });
  const [search, setSearch] = useState({
    name: "",
    customer: "",
    contractor: "",
    region: ""
  });

  const surveyTypes = [
    "Инженерно-экологические изыскания",
    "Инженерно-геологические изыскания",
    "Инженерно-геодезические изыскания",
    "Инженерно-гидрометеорологические изыскания"
  ];

  useEffect(() => {
    const saved = localStorage.getItem("projects");
    if (saved) setProjects(JSON.parse(saved));

    const deleted = localStorage.getItem("deletedProjects");
    if (deleted) {
      const parsed = JSON.parse(deleted);
      const now = new Date().getTime();
      const filtered = parsed.filter(p => now - p.deletedAt < 30 * 24 * 60 * 60 * 1000);
      setDeletedProjects(filtered);
      localStorage.setItem("deletedProjects", JSON.stringify(filtered));
    }
  }, []);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const saveProject = () => {
    let updated = [...projects];
    if (editingIndex !== null) {
      updated[editingIndex] = { ...updated[editingIndex], ...form };
    } else {
      const newNumber = "PRJ-" + String(projects.length + 1).padStart(3, "0");
      updated.push({ number: newNumber, ...form });
    }
    localStorage.setItem("projects", JSON.stringify(updated));
    setProjects(updated);
    resetForm();
    setView("main");
  };

  const editProject = (index) => {
    const project = projects[index];
    setForm(project);
    setEditingIndex(index);
    setView("new");
  };

  const deleteProject = (index) => {
    const removed = projects[index];
    const remaining = projects.filter((_, i) => i !== index);
    const updatedDeleted = [...deletedProjects, { ...removed, deletedAt: new Date().getTime() }];
    setProjects(remaining);
    setDeletedProjects(updatedDeleted);
    localStorage.setItem("projects", JSON.stringify(remaining));
    localStorage.setItem("deletedProjects", JSON.stringify(updatedDeleted));
  };

  const restoreProject = (number) => {
    const toRestore = deletedProjects.find(p => p.number === number);
    if (!toRestore) return;
    const updatedProjects = [...projects, { ...toRestore }];
    const updatedTrash = deletedProjects.filter(p => p.number !== number);
    setProjects(updatedProjects);
    setDeletedProjects(updatedTrash);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    localStorage.setItem("deletedProjects", JSON.stringify(updatedTrash));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    projects.forEach((p, i) => {
      const offset = i * 50;
      doc.text("Проект " + p.number, 10, 10 + offset);
      doc.text("Название: " + p.name, 10, 16 + offset);
      doc.text("Тип: " + p.type, 10, 22 + offset);
      doc.text("Адрес: " + [p.region, p.district, p.city, p.street].join(", "), 10, 28 + offset);
      doc.text("Заказчик: " + p.customer, 10, 34 + offset);
      doc.text("Исполнитель: " + p.contractor, 10, 40 + offset);
    });
    doc.save("projects.pdf");
  };

  const exportWord = async () => {
    const paragraphs = projects.map(p =>
      new Paragraph({
        children: [
          new TextRun({ text: "Проект " + p.number, bold: true }),
          new TextRun("\nНазвание: " + p.name),
          new TextRun("\nТип: " + p.type),
          new TextRun("\nАдрес: " + [p.region, p.district, p.city, p.street].join(", ")),
          new TextRun("\nЗаказчик: " + p.customer),
          new TextRun("\nИсполнитель: " + p.contractor),
          new TextRun("\n\n")
        ]
      })
    );

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "projects.docx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "",
      region: "",
      district: "",
      city: "",
      street: "",
      customer: "",
      contractor: ""
    });
    setEditingIndex(null);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.name.toLowerCase()) &&
    p.customer.toLowerCase().includes(search.customer.toLowerCase()) &&
    p.contractor.toLowerCase().includes(search.contractor.toLowerCase()) &&
    (p.region + p.district + p.city + p.street).toLowerCase().includes(search.region.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <button onClick={() => setView("new")} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl shadow">Новый проект</button>
          <button onClick={() => setView("list")} className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow">Проекты</button>
          <button onClick={() => setView("trash")} className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-xl shadow">Корзина</button>
        </div>
      </div>
    </div>
  );
}
