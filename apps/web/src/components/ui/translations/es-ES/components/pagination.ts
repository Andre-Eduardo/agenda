import type {Dictionary} from '../..';
import type {PaginationTranslations} from '../../../components/Pagination/translations';

export const pagination: Dictionary<PaginationTranslations> = {
    pagination: 'Paginación',
    page: 'Página {{page}}',
    next: 'Próximo',
    prev: 'Anterior',
    summary: 'Página {{currentPage}} de {{totalPages}}',
    goToNext: 'Ir a la página siguiente',
    goToPrev: 'Ir a la página anterior',
    itemCount: '{{from}}-{{to}} de {{total}} registros',
};
