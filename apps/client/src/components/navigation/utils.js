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

    return links;
}
