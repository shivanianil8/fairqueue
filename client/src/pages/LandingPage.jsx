import React from 'react';
import { 
  Scale, 
  ShieldCheck, 
  Cpu, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Clock, 
  FileText,
  Lock
} from 'lucide-react';
import { navigate } from '../services/router.js';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white flex flex-col justify-between">
      {/* 1. Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
              FQ
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">FAIRQUEUE</span>
              <span className="ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">v2.0 SaaS</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition shadow-xs flex items-center space-x-1.5"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-slate-600" />
          <span>Declarative First-Order Horn Clause Logic Inference</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Intelligent Queue Fairness Analyzer
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Production-grade multi-tenant queue decision platform. Replace opaque black-box heuristics with provable Prolog deduction, granular role-based governance, and immutable audit logs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 text-white rounded-md font-medium text-sm hover:bg-slate-800 transition shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Start Free Organization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-3 bg-white text-slate-800 border border-slate-300 rounded-md font-medium text-sm hover:bg-slate-50 transition"
          >
            Sign In to Existing Desk
          </button>
        </div>

        {/* Demo Quick Notice */}
        <div className="mt-8 p-3 bg-slate-100/80 border border-slate-200 rounded-lg max-w-xl mx-auto text-left text-xs text-slate-600 flex items-start space-x-3">
          <Building2 className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-800">Pre-Configured Demo Environment Available:</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Login as administrator with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-slate-800">admin@citycare.gov</code> and password <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-slate-800">Admin@123</code>, or register your own organization.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Architectural Pillars */}
      <section className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Queue Governance</h2>
            <p className="text-slate-500 text-sm mt-1">Built specifically for hospitals, civic registry centres, and public administration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Pure First-Order Logic Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Priorities are computed using pure Prolog Horn clauses with backward chaining resolution. Zero hallucination, deterministic explanations, and verifiable deduction trees.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Real Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every organization's queue data, custom policy thresholds, and audit histories are strictly segregated at the database query layer.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Immutable Audit Ledger</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every manual priority override requires verified role authorization and mandatory written justification, recorded indelibly for governance review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-slate-100 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">FAIRQUEUE</span>
            <span>•</span>
            <span>Intelligent Queue Fairness Analyzer</span>
          </div>
          <div>
            <span>Logic Programming Paradigms • ISO Prolog Rule-Based Expert System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
