'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, Landmark, FileSpreadsheet } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Hoje', href: '/', icon: LayoutDashboard },
  { name: 'Movimentações', href: '/movimentacoes', icon: ArrowLeftRight },
  { name: 'Patrimônio', href: '/patrimonio', icon: Landmark },
  { name: 'IR', href: '/ir', icon: FileSpreadsheet },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors text-xs font-medium',
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'scale-110')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
