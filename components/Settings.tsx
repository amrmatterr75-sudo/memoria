import React from 'react';
import { ThemeConfig, UserProfile } from '../types';
import { PRESET_THEMES } from '../constants';
import { Palette, Type, Image as ImageIcon, Layout, Sliders, Smartphone, Monitor, Upload } from 'lucide-react';

interface SettingsProps {
  theme: ThemeConfig;
  setTheme: (t: ThemeConfig) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, user, setUser }) => {
  const handlePresetChange = (name: string) => {
    if (PRESET_THEMES[name]) {
      setTheme({ ...PRESET_THEMES[name] });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTheme({
          ...theme,
          backgroundImage: reader.result as string,
          name: 'Custom'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const fonts = ['Inter', 'Roboto', 'Playfair Display', 'Merriweather', 'Oswald', 'Cinzel', 'Quicksand', 'Pacifico', 'Space Mono'];

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      
      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">{user.avatar}</span> Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Display Name</label>
            <input 
              type="text" 
              value={user.name} 
              onChange={(e) => setUser({...user, name: e.target.value})}
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 opacity-70">Avatar</label>
             <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                {['👨‍⚕️','👩‍⚕️','🧬','🧠','🔬','💊','🎓','🩺','💀'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => setUser({...user, avatar: emoji})}
                    className={`text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${user.avatar === emoji ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Theme Presets */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5"/> Theme Presets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(PRESET_THEMES).map(preset => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`p-4 rounded-xl border transition-all relative overflow-hidden group ${theme.name === preset ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-50' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <div 
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ backgroundImage: `url(${PRESET_THEMES[preset].backgroundImage})`, backgroundSize: 'cover' }}
              />
              <span className="relative z-10 font-bold">{preset}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Advanced Customization */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sliders className="w-5 h-5"/> Customizer</h2>

        {/* Colors & Fonts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Palette className="w-4 h-4"/> Primary Color</label>
            <div className="flex flex-wrap gap-2">
              {['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#d4af37', '#64748b'].map(c => (
                <button
                  key={c}
                  onClick={() => setTheme({...theme, primaryColor: c, name: 'Custom'})}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 ${theme.primaryColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                />
              ))}
              <input 
                type="color" 
                value={theme.primaryColor}
                onChange={(e) => setTheme({...theme, primaryColor: e.target.value, name: 'Custom'})}
                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Type className="w-4 h-4"/> Typography</label>
            <select 
              value={theme.fontFamily}
              onChange={(e) => setTheme({...theme, fontFamily: e.target.value, name: 'Custom'})}
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              {fonts.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Wallpaper Engine */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
           <label className="block text-sm font-medium mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Wallpaper Source</label>
           
           <div className="flex gap-4 mb-4">
             <div className="flex-1">
               <input 
                 type="text" 
                 placeholder="Paste Image URL..."
                 value={theme.backgroundImage}
                 onChange={(e) => setTheme({...theme, backgroundImage: e.target.value, name: 'Custom'})}
                 className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
               />
             </div>
             <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors">
               <Upload className="w-5 h-5 text-gray-500" />
               <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
             </label>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-xs mb-1 block opacity-70">Blur (px)</label>
                <input type="range" min="0" max="20" value={theme.bgConfig.blur} 
                  onChange={(e) => setTheme({...theme, bgConfig: {...theme.bgConfig, blur: Number(e.target.value)}})} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <label className="text-xs mb-1 block opacity-70">Scale (%)</label>
                <input type="range" min="50" max="200" value={theme.bgConfig.scale} 
                  onChange={(e) => setTheme({...theme, bgConfig: {...theme.bgConfig, scale: Number(e.target.value)}})} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <label className="text-xs mb-1 block opacity-70">Opacity (%)</label>
                <input type="range" min="0" max="100" value={theme.bgConfig.opacity} 
                  onChange={(e) => setTheme({...theme, bgConfig: {...theme.bgConfig, opacity: Number(e.target.value)}})} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setTheme({...theme, bgConfig: {...theme.bgConfig, portraitMode: !theme.bgConfig.portraitMode}})}
                  className={`flex-1 flex flex-col items-center justify-center p-2 rounded border ${theme.bgConfig.portraitMode ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200'}`}
                 >
                   {theme.bgConfig.portraitMode ? <Smartphone className="w-4 h-4"/> : <Monitor className="w-4 h-4"/>}
                   <span className="text-[10px] mt-1">{theme.bgConfig.portraitMode ? 'Sidebar Only' : 'Full Screen'}</span>
                 </button>
              </div>
           </div>
        </div>

        {/* UI Mode */}
        <div className="flex gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
           <button onClick={() => setTheme({...theme, mode: 'light'})} className={`flex-1 p-3 rounded-lg border ${theme.mode === 'light' ? 'bg-gray-100 border-gray-300' : 'border-gray-200'}`}>Light Mode</button>
           <button onClick={() => setTheme({...theme, mode: 'dark'})} className={`flex-1 p-3 rounded-lg border ${theme.mode === 'dark' ? 'bg-gray-900 text-white border-gray-700' : 'border-gray-200'}`}>Dark Mode</button>
        </div>

      </section>
    </div>
  );
};