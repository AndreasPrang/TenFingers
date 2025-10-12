import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classesAPI } from '../services/api';
import { Class, Student, StudentProgress } from '../types';
import '../styles/Teacher.css';

const ClassManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'progress'>('students');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
  const [bulkNames, setBulkNames] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<Array<{ username: string; password: string }>>([]);

  useEffect(() => {
    loadClassData();
  }, [id]);

  const loadClassData = async () => {
    try {
      const classId = Number(id);
      const [cls, studs, prog] = await Promise.all([
        classesAPI.getClassById(classId),
        classesAPI.getClassStudents(classId),
        classesAPI.getClassProgress(classId),
      ]);
      setClassData(cls);
      setStudents(studs);
      setProgress(prog);
    } catch (error) {
      console.error('Fehler beim Laden der Klassendaten:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      await classesAPI.addStudentToClass(
        Number(id),
        newStudent.username,
        newStudent.password,
        newStudent.email || undefined
      );
      setNewStudent({ username: '', email: '', password: '' });
      setShowAddModal(false);
      loadClassData();
    } catch (error: any) {
      console.error('Fehler beim Hinzufügen des Schülers:', error);
      alert(error.response?.data?.error || 'Fehler beim Hinzufügen des Schülers');
    } finally {
      setAdding(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkCreating(true);

    try {
      const names = bulkNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (names.length === 0) {
        alert('Bitte gib mindestens einen Namen ein');
        return;
      }

      if (names.length > 35) {
        alert('Maximal 35 Schüler können gleichzeitig erstellt werden');
        return;
      }

      const response = await classesAPI.bulkCreateStudents(Number(id), names);

      if (response.errors && response.errors.length > 0) {
        alert(`Warnung: ${response.errors.length} Schüler konnten nicht erstellt werden:\n${response.errors.map(e => `${e.name}: ${e.error}`).join('\n')}`);
      }

      // Speichere Credentials für Download
      setCreatedCredentials(response.students.map(s => ({ username: s.username, password: s.password })));

      setBulkNames('');
      loadClassData();
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Schüler:', error);
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Schüler');
      setBulkCreating(false);
    }
  };

  const downloadCredentials = () => {
    const csvContent = 'Benutzername,Passwort\n' +
      createdCredentials.map(c => `${c.username},${c.password}`).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `schueler_zugangsdaten_${classData?.name || 'klasse'}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Schließe Modal und setze Credentials zurück
    setCreatedCredentials([]);
    setShowBulkModal(false);
    setBulkCreating(false);
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkNames('');
    setCreatedCredentials([]);
    setBulkCreating(false);
  };

  const handleEditClick = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      username: student.username,
      email: student.email || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setEditing(true);

    try {
      await classesAPI.updateStudent(
        Number(id),
        editStudent.id,
        editForm.username,
        editForm.email || undefined,
        editForm.password || undefined
      );
      setEditForm({ username: '', email: '', password: '' });
      setEditStudent(null);
      setShowEditModal(false);
      loadClassData();
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Schülers:', error);
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren des Schülers');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteClick = (studentId: number) => {
    setDeleteStudentId(studentId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStudentId) return;

    setDeleting(true);

    try {
      await classesAPI.deleteStudent(Number(id), deleteStudentId);
      setDeleteStudentId(null);
      setShowDeleteConfirm(false);
      loadClassData();
    } catch (error: any) {
      console.error('Fehler beim Löschen des Schülers:', error);
      alert(error.response?.data?.error || 'Fehler beim Löschen des Schülers');
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteStudentId(null);
  };

  if (loading) {
    return (
      <div className="teacher-container">
        <div className="loading">Lade Klassendaten...</div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="teacher-container">
        <div className="error-message">Klasse nicht gefunden</div>
      </div>
    );
  }

  return (
    <div className="teacher-container">
      <header className="class-header">
        <button className="btn-back" onClick={() => navigate('/teacher')}>
          ← Zurück
        </button>
        <div className="class-info">
          <h1>{classData.name}</h1>
          <p>{students.length} Schüler</p>
        </div>
        <div className="header-actions">
          <button className="btn-create" onClick={() => setShowAddModal(true)}>
            + Einzelnen Schüler
          </button>
          <button className="btn-create-bulk" onClick={() => setShowBulkModal(true)}>
            + Mehrere Schüler
          </button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Schüler ({students.length})
        </button>
        <button
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Fortschritt
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="students-section">
          {students.length === 0 ? (
            <div className="empty-state">
              <h2>Keine Schüler</h2>
              <p>Füge deinen ersten Schüler hinzu.</p>
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                Schüler hinzufügen
              </button>
            </div>
          ) : (
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>Benutzername</th>
                    <th>E-Mail</th>
                    <th>Abgeschlossen</th>
                    <th>Durchschn. WPM</th>
                    <th>Genauigkeit</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.username}</td>
                      <td>{student.email || '-'}</td>
                      <td>{student.total_lessons_completed || 0}</td>
                      <td>{student.average_wpm ? Number(student.average_wpm).toFixed(1) : '0.0'}</td>
                      <td>{student.average_accuracy ? Number(student.average_accuracy).toFixed(1) + '%' : '0.0%'}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditClick(student)}
                            title="Bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(student.id)}
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="progress-section">
          {progress.length === 0 ? (
            <div className="empty-state">
              <h2>Keine Daten</h2>
              <p>Noch kein Schüler hat mit dem Üben begonnen.</p>
            </div>
          ) : (
            <div className="progress-table">
              <table>
                <thead>
                  <tr>
                    <th>Schüler</th>
                    <th>Abgeschlossen</th>
                    <th>WPM</th>
                    <th>Genauigkeit</th>
                    <th>Versucht</th>
                    <th>Letzte Übung</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((p) => (
                    <tr key={p.student_id}>
                      <td>{p.username}</td>
                      <td>{p.total_lessons_completed}</td>
                      <td>{Number(p.average_wpm).toFixed(1)}</td>
                      <td>{Number(p.average_accuracy).toFixed(1)}%</td>
                      <td>{p.lessons_attempted}</td>
                      <td>{p.last_practice ? new Date(p.last_practice).toLocaleDateString('de-DE') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schüler hinzufügen</h2>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label htmlFor="username">Benutzername</label>
                <input
                  type="text"
                  id="username"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                  required
                  disabled={adding}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-Mail (optional)</label>
                <input
                  type="email"
                  id="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  disabled={adding}
                  placeholder="optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Passwort</label>
                <input
                  type="password"
                  id="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  disabled={adding}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={adding}>
                  {adding ? 'Füge hinzu...' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal-overlay" onClick={() => !bulkCreating && closeBulkModal()}>
          <div className="modal-content modal-bulk" onClick={(e) => e.stopPropagation()}>
            {createdCredentials.length > 0 ? (
              <>
                <h2>Schüler erfolgreich erstellt!</h2>
                <p className="success-message">
                  {createdCredentials.length} Schüler wurden erfolgreich erstellt.
                  Lade die Zugangsdaten herunter, um sie an die Schüler zu verteilen.
                </p>
                <div className="credentials-preview">
                  <h3>Zugangsdaten Vorschau:</h3>
                  <div className="credentials-list">
                    {createdCredentials.slice(0, 5).map((cred, idx) => (
                      <div key={idx} className="credential-item">
                        <strong>{cred.username}</strong>: {cred.password}
                      </div>
                    ))}
                    {createdCredentials.length > 5 && (
                      <div className="credential-item">... und {createdCredentials.length - 5} weitere</div>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeBulkModal}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={downloadCredentials}
                  >
                    CSV herunterladen
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Mehrere Schüler erstellen</h2>
                <p className="bulk-instructions">
                  Gib die Namen der Schüler ein (einen Namen pro Zeile).
                  Passwörter werden automatisch generiert und zum Download bereitgestellt.
                  Maximal 35 Schüler gleichzeitig.
                </p>
                <form onSubmit={handleBulkCreate}>
                  <div className="form-group">
                    <label htmlFor="bulkNames">Namen (einer pro Zeile)</label>
                    <textarea
                      id="bulkNames"
                      value={bulkNames}
                      onChange={(e) => setBulkNames(e.target.value)}
                      placeholder="Max Mustermann&#10;Anna Schmidt&#10;Tom Meyer&#10;..."
                      rows={15}
                      required
                      disabled={bulkCreating}
                      autoFocus
                    />
                    <small className="form-hint">
                      {bulkNames.split('\n').filter(n => n.trim()).length} / 35 Schüler
                    </small>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeBulkModal}
                      disabled={bulkCreating}
                    >
                      Abbrechen
                    </button>
                    <button type="submit" className="btn-primary" disabled={bulkCreating}>
                      {bulkCreating ? 'Erstelle Schüler...' : 'Schüler erstellen'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showEditModal && editStudent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schüler bearbeiten</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="editUsername">Benutzername</label>
                <input
                  type="text"
                  id="editUsername"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                  disabled={editing}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEmail">E-Mail (optional)</label>
                <input
                  type="email"
                  id="editEmail"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={editing}
                  placeholder="optional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPassword">Neues Passwort (optional)</label>
                <input
                  type="password"
                  id="editPassword"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leer lassen, um beizubehalten"
                  disabled={editing}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={editing}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={editing}>
                  {editing ? 'Aktualisiere...' : 'Aktualisieren'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && closeDeleteConfirm()}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Schüler löschen?</h2>
            <p className="confirm-message">
              Möchtest du diesen Schüler wirklich löschen? Alle Fortschrittsdaten gehen verloren.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Lösche...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
