<!-- confirmation modal modal -->
<div class="modal fade confirmation-modal" id="secureActionConfirmation" tabindex="-1" role="dialog"
    aria-labelledby="secureActionConfirmationLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-body text-start">
                <div class="main-img">
                    <i class="ri-delete-bin-line "></i>
                </div>
                <div class="text-center">
                    <div class="modal-title" id="secureActionTitle">{{__('static.delete_message')}}</div>
                    <p class="mb-0" id="secureActionNote">{{__('static.delete_note')}}</p>
                </div>
            </div>
            <div class="modal-footer">
                <form method="POST" action="" id="secureActionForm">
                    @csrf
                    <input type="hidden" name="_method" id="secureActionMethod" value="DELETE">
                    <button type="button" class="btn btn-primary m-0"
                        data-bs-dismiss="modal">{{ __('static.cancel') }}</button>
                    <button type="submit" class="btn btn-secondary delete-btn m-0">{{ __('static.delete') }}</button>
                </form>
            </div>
        </div>
    </div>
</div>

@push('scripts')
    <script>
        $(document).on('click', '.secure-action-btn', function() {
            const action = $(this);
            $('#secureActionForm').attr('action', action.data('url'));
            $('#secureActionMethod').val(action.data('method') || 'DELETE');
            if (action.data('action-label')) {
                $('#secureActionTitle').text(action.data('action-label'));
            }
        });

        $(document).on('submit', '#secureActionForm', function(e) {
            if (!$(this).attr('action')) {
                e.preventDefault();
            }
        });
    </script>
@endpush
