<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::group(['middleware' => ['auth', 'localization'], 'namespace' => 'Admin', 'as' => 'admin.'], function () {

    // Dashboard
    Route::get('ticket/dashboard', 'DashboardController@index')->name('ticket.dashboard');

    // Tickets
    Route::resource('ticket', 'TicketController', ['except' => ['show', 'destroy']]);
    Route::put('ticket/status/{id}', 'TicketController@status')->name('ticket.status');
    Route::delete('ticket/destroy/{ticket}', 'TicketController@destroy')->name('ticket.destroy')->middleware('can:ticket.ticket.destroy');
    Route::patch('ticket/restore/{id}', 'TicketController@restore')->name('ticket.restore')->middleware('can:ticket.ticket.restore');
    Route::delete('ticket/force-delete/{id}', 'TicketController@forceDelete')->name('ticket.forceDelete')->middleware('can:ticket.ticket.forceDelete');
    Route::get('ticket/reply/{ticket}', 'TicketController@reply')->name('ticket.reply')->middleware('can:ticket.ticket.reply');
    Route::post('ticket/reply', 'MessageController@store')->name('reply.store')->middleware('can:ticket.ticket.reply');
    Route::get('ticket/download/{mediaId}', 'TicketController@download')->name('ticket.file.download')->middleware('can:ticket.ticket.reply');
    Route::post('ticket/assign', 'TicketController@assign')->name('ticket.assign');
    Route::delete('message/destroy/{message}', 'MessageController@destroy')->name('message.destroy')->middleware('can:ticket.ticket.destroy');

    // Statuses
    Route::resource('status', 'StatusController', ['except' => ['show', 'destroy']]);
    Route::put('status/status/{id}', 'StatusController@status')->name('status.status')->middleware('can:ticket.status.edit');
    Route::patch('status/restore/{id}', 'StatusController@restore')->name('status.restore')->middleware('can:ticket.status.restore');
    Route::delete('status/force-delete/{id}', 'StatusController@forceDelete')->name('status.forceDelete')->middleware('can:ticket.status.forceDelete');

    // Priorities
    Route::resource('priority', 'PriorityController', ['except' => ['show', 'destroy']]);
    Route::put('priority/status/{id}', 'PriorityController@status')->name('priority.status')->middleware('can:ticket.priority.edit');
    Route::patch('priority/restore/{id}', 'PriorityController@restore')->name('priority.restore')->middleware('can:ticket.priority.restore');
    Route::delete('priority/force-delete/{id}', 'PriorityController@forceDelete')->name('priority.forceDelete')->middleware('can:ticket.priority.forceDelete');

    // Executives
    Route::resource('executive', 'ExecutiveController', ['except' => ['show', 'destroy']]);
    Route::put('executive/status/{id}', 'ExecutiveController@status')->name('executive.status')->middleware('can:ticket.executive.edit');
    Route::delete('executive/destroy/{executive}', 'ExecutiveController@destroy')->name('executive.destroy')->middleware('can:ticket.executive.destroy');
    Route::patch('executive/restore/{id}', 'ExecutiveController@restore')->name('executive.restore')->middleware('can:ticket.executive.restore');
    Route::delete('executive/force-delete/{id}', 'ExecutiveController@forceDelete')->name('executive.forceDelete')->middleware('can:ticket.executive.forceDelete');

    // Departments
    Route::resource('department', 'DepartmentController', ['except' => ['show', 'destroy']]);
    Route::put('department/status/{id}', 'DepartmentController@status')->name('department.status')->middleware('can:ticket.department.edit');
    Route::get('department/show/{department}', 'DepartmentController@show')->name('department.show')->middleware('can:ticket.department.show');
    Route::patch('department/restore/{id}', 'DepartmentController@restore')->name('department.restore')->middleware('can:ticket.department.restore');
    Route::delete('department/force-delete/{id}', 'DepartmentController@forceDelete')->name('department.forceDelete')->middleware('can:ticket.department.forceDelete');

    // Form-Fields
    Route::resource('formfield', 'FormFieldController', ['except' => ['show','destroy']]);
    Route::put('formfield/status/{id}', 'FormFieldController@status')->name('formfield.status')->middleware('can:ticket.formfield.edit');
    Route::delete('formfield/destroy/{formfield}', 'FormFieldController@destroy')->name('formfield.destroy')->middleware('can:ticket.formfield.destroy');
    Route::patch('formfield/restore/{id}', 'FormFieldController@restore')->name('formfield.restore')->middleware('can:ticket.formfield.restore');
    Route::delete('formfield/force-delete/{id}', 'FormFieldController@forceDelete')->name('formfield.forceDelete')->middleware('can:ticket.formfield.forceDelete');

    // Knowledge-base
    Route::resource('knowledge', 'KnowledgeController', ['except' => ['show','destroy']]);
    Route::get('knowledge/slug', 'KnowledgeController@slug')->name('knowledge.slug');
    Route::put('knowledge/status/{id}', 'KnowledgeController@status')->name('knowledge.status')->middleware('can:ticket.knowledge.edit');
    Route::delete('knowledge/destroy/{knowledge}', 'KnowledgeController@destroy')->name('knowledge.destroy')->middleware('can:ticket.knowledge.destroy');
    Route::patch('knowledge/restore/{id}', 'KnowledgeController@restore')->name('knowledge.restore')->middleware('can:ticket.knowledge.restore');
    Route::delete('knowledge/force-delete/{id}', 'KnowledgeController@forceDelete')->name('knowledge.forceDelete')->middleware('can:ticket.knowledge.forceDelete');
    Route::delete('delete-knowledge', 'KnowledgeController@deleteRows')->name('delete.knowledge');

    // Reports
    Route::get('report','ReportController@index')->name('report.index');
    Route::get('report/show/{id}','ReportController@show')->name('report.show');

    // Ratings
    Route::resource('rating', 'RatingController', ['except' => ['show','destroy']]);
    Route::get('rating/ticket-status/{id}', 'RatingController@getTicketStatus');
    
    // Prefix Routes
    Route::prefix('ticket')->name('ticket.')->group(function () {

        // Ticket Settings
        Route::resource('setting', 'SettingController');

        // Knowledge-base Categories
        Route::resource('category', 'CategoryController', ['except' => ['show']]);
        Route::get('category/slug', 'CategoryController@slug')->name('category.slug');
        Route::post('category/update-orders', 'CategoryController@updateOrders')->name('category.update.orders');

        // Knowledge-base Tags
        Route::resource('tag', 'TagController', ['except' => ['show', 'destroy']]);
        Route::put('tag/status/{id}', 'TagController@status')->name('tag.status')->middleware('can:ticket.tag.edit');
        Route::delete('tag/destroy/{tag}', 'TagController@destroy')->name('tag.destroy')->middleware('can:ticket.tag.destroy');
        Route::patch('tag/restore/{id}', 'TagController@restore')->name('tag.restore')->middleware('can:ticket.tag.restore');
        Route::delete('tag/force-delete/{id}', 'TagController@forceDelete')->name('tag.forceDelete')->middleware('can:ticket.tag.forceDelete');
        Route::delete('delete-tags', 'TagController@deleteRows')->name('delete.tags');

    });

    // Testing PIPING Emails
    Route::get('ticket/emails/incoming', 'CronJobController@incoming')->name('ticket.incoming');
});
