const handleCoverClick = () => {
    console.log('Botão da capa clicado')
    // Se não há capa, abre diretamente o editor
    if (!profileData.coverPhoto) {
      setShowCoverEditor(true)
    } else {
      // Se há capa, mostra o dropdown
      setShowCoverDropdown(!showCoverDropdown)
    }
  }
