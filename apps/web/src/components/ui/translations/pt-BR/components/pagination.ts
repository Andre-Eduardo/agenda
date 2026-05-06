import type {Dictionary} from '../..';
import type {PaginationTranslations} from '../../../components/Pagination/translations';

export const pagination: Dictionary<PaginationTranslations> = {
    pagination: 'Paginação',
    page: 'Página {{page}}',
    next: 'Próximo',
    prev: 'Anterior',
    summary: 'Página {{currentPage}} de {{totalPages}}',
    goToNext: 'Ir para a próxima página',
    goToPrev: 'Ir para a página anterior',
    itemCount: '{{from}}-{{to}} de {{total}} registros',
};
