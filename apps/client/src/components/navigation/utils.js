export const getLinks = (pathname) => {
    let links = [];

    if (pathname === '/login') {
      links = links.concat({name: 'Registro', to: '/registro'});
      links = links.concat({name: 'Inicio', to: '/'});
    }

    if (pathname === '/registro') {
      links = links.concat({name: 'Inicio', to: '/'});
      links = links.concat({name: 'Iniciar Sesión', to: '/login'});
    }

    if (pathname === '/') {
      links = links.concat({name: 'Iniciar Sesión', to: '/login'});
      links = links.concat({name: 'Registro', to: '/registro'});
    }

    if (pathname === '/verificar') {
      links = links.concat({name: 'Iniciar Sesión', to: '/login'});
      links = links.concat({name: 'Inicio', to: '/'});
    }

    // Rutas del Dashboard (cuando el usuario está autenticado)
    if (pathname.startsWith('/dashboard')) {
      links = links.concat({name: 'Dashboard', to: '/dashboard'});
      links = links.concat({name: 'Historial', to: '/dashboard/historial'});
      links = links.concat({name: 'Reportes', to: '/dashboard/reportes', id: 'nav-reportes'});
      links = links.concat({name: 'Cerrar Sesión', to: '#', id: 'btn-signout'});
    }

    return links;
}
