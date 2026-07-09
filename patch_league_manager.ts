import fs from 'fs';

const filePath = 'src/admin/shared/LeagueManager.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add auth import if missing
if (!content.includes('import { db, auth } from')) {
    content = content.replace("import { db } from '../../firebase';", "import { db, auth } from '../../firebase';");
}

// 2. Add Sparkles import
if (!content.includes('Sparkles')) {
    content = content.replace("Settings2, HelpCircle, Plus", "Settings2, HelpCircle, Plus, Sparkles");
}

// 3. Add state
const stateToAdd = `
  const [arabizingId, setArabizingId] = useState<string | null>(null);

  const handleArabizeLeague = async (id: string, name: string) => {
    if (!window.confirm('هل أنت متأكد من تعريب هذه البطولة وجميع فرقها تلقائياً؟ قد تستغرق هذه العملية بعض الوقت وتستهلك من رصيد الذكاء الاصطناعي.')) return;
    setArabizingId(id);
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin/arabize-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token || ''}\`
            },
            body: JSON.stringify({ leagueId: id, leagueName: name })
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'فشل في عملية التعريب');
        
        showToast(result.message, 'success');
        await loadData(); // Reload to see new customNames
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setArabizingId(null);
    }
  };
`;
if (!content.includes('handleArabizeLeague')) {
    content = content.replace("const [uploading, setUploading] = useState(false);", "const [uploading, setUploading] = useState(false);" + stateToAdd);
}

// 4. Add UI button in table
const uiToReplace = `<button onClick={() => handleDeleteLeague(l.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 size={14} /></button>`;
const uiToAdd = `
                            <button 
                                onClick={() => handleArabizeLeague(l.id, l.name)} 
                                disabled={arabizingId === l.id}
                                title="تعريب البطولة والفرق بالذكاء الاصطناعي"
                                className={cn("p-1.5 rounded-xl transition-all flex items-center justify-center", arabizingId === l.id ? "bg-primary/10 text-primary animate-pulse" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20")}>
                                {arabizingId === l.id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            </button>
                            <button onClick={() => handleDeleteLeague(l.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all" title="حذف"><Trash2 size={14} /></button>
`;
if (!content.includes('title="تعريب البطولة والفرق بالذكاء الاصطناعي"')) {
    content = content.replace(uiToReplace, uiToAdd);
}

fs.writeFileSync(filePath, content);
console.log('LeagueManager patched successfully.');
