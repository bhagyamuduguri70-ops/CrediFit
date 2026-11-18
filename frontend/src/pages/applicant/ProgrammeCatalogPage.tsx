import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Programme } from "../../types";
import { BookOpen, Clock, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";

export const ProgrammeCatalogPage: React.FC = () => {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgrammes() {
      try {
        const res = await api.get("/courses/programmes");
        setProgrammes(res.data.data || []);
      } catch (err) {
        console.error("Error loading programmes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProgrammes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">University Degree Programmes</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore approved undergraduate programmes offered in the current admission cycle.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading programmes catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programmes.map((p) => (
            <Card key={p.programme_id} className="flex flex-col justify-between hover:border-blue-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs">
                    {p.programme_code}
                  </span>
                  <Badge variant={p.programme_status === "ACTIVE" ? "success" : "neutral"}>
                    {p.programme_status}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{p.programme_name}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                  {p.description || "Comprehensive university undergraduate degree with academic rigour and industry alignment."}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Duration: <strong>{p.duration_years} Years</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Entry Requirement: <strong>{p.qualification_required}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/applicant/apply?programmeId=${p.programme_id}`}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  Apply for {p.programme_code} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
