{/* Capa do Perfil */}
      <div className="relative">
        <div 
          className="w-full h-48 relative cursor-pointer group"
          onClick={() => !uploading.cover && !viewAsVisitor && handleCoverClick()}
        >
          {profileData.coverPhoto ? (
            <>
              <img
                src={profileData.coverPhoto}
                alt="Capa do perfil"
                className="w-full h-full object-cover"
              />
              {/* Overlay para hover quando há imagem */}
              {!viewAsVisitor && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center">
                    <Camera size={24} className="mx-auto mb-1" />
                    <p className="text-sm font-medium">Alterar capa</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              {!viewAsVisitor ? (
                <div className="text-center text-gray-600 group-hover:text-gray-800 transition-colors">
                  <Camera size={32} className="mx-auto mb-2" />
                  <p className="text-lg font-medium">Adicionar capa</p>
                  <p className="text-sm text-gray-500">Clique para escolher uma foto</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Camera size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg">Sem foto de capa</p>
                </div>
              )}
            </div>
          )}

          {/* Botão de opções da capa - só aparece se houver foto */}
          {profileData.coverPhoto && !viewAsVisitor && (
            <div className="absolute top-4 right-4">
              <button
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCoverClick()
                }}
                disabled={uploading.cover}
                title={uploading.cover ? "Fazendo upload..." : "Opcoes da capa"}
              >
                <Camera size={20} />
              </button>

              <CoverDropdown
                isOpen={showCoverDropdown}
                onClose={() => setShowCoverDropdown(false)}
                user={profileData}
                onEditCover={handleEditCoverFromDropdown}
                onViewCover={handleViewCover}
              />
            </div>
          )}

          {uploading.cover && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Fazendo upload...</p>
              </div>
            </div>
          )}
        </div>
      </div>
