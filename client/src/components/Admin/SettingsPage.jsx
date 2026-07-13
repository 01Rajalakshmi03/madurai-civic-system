import React, { useState } from 'react';
import {
  FiSettings, FiShield, FiDatabase, FiMail, FiCheckCircle
} from 'react-icons/fi';

function Toggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'} opacity-60 cursor-not-allowed`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function InputField({ label, placeholder, value, disabled = true }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${iconColor}`}>
          <Icon className="text-lg text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {children}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 pt-3 text-center italic">
        Settings are UI-only for now. Backend integration coming soon.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings] = useState({
    general: {
      siteName: 'Madurai Smart City',
      maintenanceMode: false,
      registrationOpen: true,
      maxFileSize: '10 MB',
      defaultLanguage: 'English',
    },
    email: {
      smtpHost: 'smtp.example.com',
      smtpPort: '587',
      senderEmail: 'noreply@madurai.gov.in',
      emailNotifications: true,
      weeklyReports: true,
    },
    blockchain: {
      networkUrl: 'http://localhost:8545',
      contractAddress: '0x1234...abcd',
      autoSync: true,
      syncInterval: '5 minutes',
      verificationEnabled: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30 minutes',
      passwordPolicy: 'Strong',
      ipWhitelist: '',
      auditLogging: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiSettings className="text-gray-500" /> System Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Configure application preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <SectionCard icon={FiSettings} iconColor="bg-gray-500" title="General Settings">
          <InputField label="Site Name" placeholder="Site name" value={settings.general.siteName} />
          <Toggle label="Maintenance Mode" description="Temporarily disable public access" enabled={settings.general.maintenanceMode} onChange={() => { }} />
          <Toggle label="Open Registration" description="Allow new users to register" enabled={settings.general.registrationOpen} onChange={() => { }} />
          <InputField label="Max File Upload Size" placeholder="10 MB" value={settings.general.maxFileSize} />
          <div className="py-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Language</label>
            <select disabled className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none opacity-50 cursor-not-allowed">
              <option>English</option>
              <option>Tamil</option>
              <option>Hindi</option>
            </select>
          </div>
        </SectionCard>

        {/* Email Configuration */}
        <SectionCard icon={FiMail} iconColor="bg-blue-500" title="Email Configuration">
          <InputField label="SMTP Host" placeholder="smtp.example.com" value={settings.email.smtpHost} />
          <InputField label="SMTP Port" placeholder="587" value={settings.email.smtpPort} />
          <InputField label="Sender Email" placeholder="noreply@example.com" value={settings.email.senderEmail} />
          <Toggle label="Email Notifications" description="Send email alerts for new complaints" enabled={settings.email.emailNotifications} onChange={() => { }} />
          <Toggle label="Weekly Reports" description="Automated weekly summary reports" enabled={settings.email.weeklyReports} onChange={() => { }} />
        </SectionCard>

        {/* Blockchain Settings */}
        <SectionCard icon={FiDatabase} iconColor="bg-purple-500" title="Blockchain Settings">
          <InputField label="Network URL" placeholder="http://localhost:8545" value={settings.blockchain.networkUrl} />
          <InputField label="Contract Address" placeholder="0x..." value={settings.blockchain.contractAddress} />
          <Toggle label="Auto Sync" description="Automatically sync complaints to blockchain" enabled={settings.blockchain.autoSync} onChange={() => { }} />
          <InputField label="Sync Interval" placeholder="5 minutes" value={settings.blockchain.syncInterval} />
          <Toggle label="Verification Enabled" description="Allow citizens to verify complaints on chain" enabled={settings.blockchain.verificationEnabled} onChange={() => { }} />
        </SectionCard>

        {/* Security Settings */}
        <SectionCard icon={FiShield} iconColor="bg-red-500" title="Security Settings">
          <Toggle label="Two-Factor Authentication" description="Require 2FA for admin accounts" enabled={settings.security.twoFactorAuth} onChange={() => { }} />
          <InputField label="Session Timeout" placeholder="30 minutes" value={settings.security.sessionTimeout} />
          <InputField label="Password Policy" placeholder="Strong" value={settings.security.passwordPolicy} />
          <InputField label="IP Whitelist" placeholder="Comma-separated IPs (empty = allow all)" value={settings.security.ipWhitelist} />
          <Toggle label="Audit Logging" description="Log all admin actions for compliance" enabled={settings.security.auditLogging} onChange={() => { }} />
        </SectionCard>
      </div>
    </div>
  );
}
