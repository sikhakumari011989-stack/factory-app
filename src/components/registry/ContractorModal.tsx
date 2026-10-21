import React, { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { Contractor } from '../../types';
import { useFactory } from '../../context/FactoryContext';

interface ContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractorToEdit?: Contractor | null;
}

export const ContractorModal: React.FC<ContractorModalProps> = ({
  isOpen,
  onClose,
  contractorToEdit,
}) => {
  const { addContractor, updateContractor, contractors } = useFactory();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (contractorToEdit) {
      setName(contractorToEdit.name);
      setCode(contractorToEdit.code);
      setContactPerson(contractorToEdit.contactPerson);
      setPhone(contractorToEdit.phone);
      setEmail(contractorToEdit.email);
    } else {
      const nextNum = contractors.length + 1;
      setName('');
      setCode(`CNT-${nextNum.toString().padStart(2, '0')}`);
      setContactPerson('');
      setPhone('');
      setEmail('');
    }
  }, [contractorToEdit, isOpen, contractors.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Agency name and agency code are required.');
      return;
    }

    if (contractorToEdit) {
      updateContractor(contractorToEdit.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPerson: contactPerson.trim() || 'Operations Lead',
        phone: phone.trim(),
        email: email.trim(),
      });
    } else {
      addContractor({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPerson: contactPerson.trim() || 'Operations Lead',
        phone: phone.trim(),
        email: email.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {contractorToEdit ? 'Edit Contractor Agency' : 'Register Contractor Agency'}
              </h3>
              <p className="text-xs text-slate-400">External staffing agency & contact details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Contractor Agency Firm Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Labour Solutions Pvt Ltd"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Agency Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ALS"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Designated Contact Officer</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Direct Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Work Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agency@company.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{contractorToEdit ? 'Save Changes' : 'Register Agency'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
